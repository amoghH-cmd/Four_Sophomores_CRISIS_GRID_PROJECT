package com.crisisgrid.controller;

import com.crisisgrid.model.*;
import com.crisisgrid.service.AlgorithmService;
import com.crisisgrid.service.SimulationService;
import com.crisisgrid.service.SseService;
import com.crisisgrid.store.InMemoryDB;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @Autowired
    private InMemoryDB db;

    @Autowired
    private AlgorithmService algorithmService;

    @Autowired
    private SimulationService simulationService;

    @Autowired
    private SseService sseService;

    public static class SosRequestDto {
        public String loc;
        public String type;
        public Integer people;
        public String description;
        public Double lat;
        public Double lng;
        public String source;
    }

    @PostMapping("/sos")
    public ResponseEntity<?> createSos(@RequestBody SosRequestDto dto) {
        double lat;
        double lng;
        if (dto.lat != null && dto.lng != null) {
            lat = dto.lat;
            lng = dto.lng;
        } else {
            double[] coords = algorithmService.geocode(dto.loc);
            lat = coords[0];
            lng = coords[1];
        }

        if (algorithmService.isDuplicate(lat, lng, dto.type, db.requests)) {
            Request dup = new Request();
            dup.setId("DUP-" + UUID.randomUUID().toString().substring(0, 4));
            dup.setLoc(dto.loc);
            dup.setType(dto.type);
            dup.setPeople(dto.people != null ? dto.people : 1);
            dup.setDescription(dto.description);
            dup.setLat(lat);
            dup.setLng(lng);
            dup.setPriority("MEDIUM");
            dup.setStatus("pending");
            dup.setDuplicate(true);
            dup.setTs(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
            dup.setSource(dto.source != null ? dto.source : "web");
            
            db.requests.add(dup);
            sseService.broadcast("newRequest", dup);
            simulationService.addComms("warning", "⚠️ Duplicate Request detected near " + dto.loc);
            return ResponseEntity.ok(Map.of("success", true, "request", dup));
        }

        AlgorithmService.PriorityResult prio = algorithmService.calcPriority(dto.description, dto.people != null ? dto.people : 1);
        
        Request req = new Request();
        req.setId("REQ-" + String.format("%04d", new Random().nextInt(10000)));
        req.setLoc(dto.loc);
        req.setType(dto.type);
        req.setPeople(dto.people != null ? dto.people : 1);
        req.setDescription(dto.description);
        req.setLat(lat);
        req.setLng(lng);
        req.setPriority(prio.priority);
        req.setScore(prio.score);
        req.setStatus("pending");
        req.setDuplicate(false);
        req.setNearbyCount(algorithmService.findNearby(lat, lng, db.requests, 1.0).size());
        req.setTs(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        req.setSource(dto.source != null ? dto.source : "web");

        List<Request.AssignedNgo> alloc = algorithmService.allocateNGOs(req, db.ngos);
        
        if (alloc.isEmpty()) {
            db.requests.add(req);
            sseService.broadcast("newRequest", req);
            simulationService.addComms("error", "❌ Critical: No resources available for " + dto.loc + " (" + dto.type + ")");
            return ResponseEntity.ok(Map.of("success", true, "request", req));
        }

        req.setAssigned(alloc);
        req.setStatus("in-progress");
        req.setEta((int) (alloc.get(0).getDist() * 2 + 5));
        
        db.requests.add(req);
        sseService.broadcast("newRequest", req);

        for (Request.AssignedNgo a : alloc) {
            Ngo n = db.ngos.stream().filter(ngo -> ngo.getId().equals(a.getId())).findFirst().orElse(null);
            if (n != null) {
                n.setUsed(n.getUsed() + a.getAssignedCount());
                sseService.broadcast("ngoUpdate", db.ngos);
                simulationService.startTracking(req, n);
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "request", req));
    }

    public static class NgoAuthDto {
        public String name;
        public String password;
    }

    @PostMapping("/ngos/login")
    public ResponseEntity<?> loginNgo(@RequestBody NgoAuthDto dto) {
        Ngo ngo = db.loginNgo(dto.name, dto.password);
        if (ngo != null) {
            return ResponseEntity.ok(Map.of("success", true, "ngo", ngo));
        }
        return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials"));
    }

    public static class NgoRegisterDto {
        public String name;
        public String password;
        public String location; // <--- added location
        public double lat;
        public double lng;
        public int capacity;
        public List<String> resources;
        public String phone;
        public String specialization;
    }

    @PostMapping("/ngos/register")
    public ResponseEntity<?> registerNgo(@RequestBody NgoRegisterDto dto) {
        double lat = dto.lat;
        double lng = dto.lng;
        if (dto.location != null && !dto.location.trim().isEmpty()) {
            double[] coords = algorithmService.geocode(dto.location);
            lat = coords[0];
            lng = coords[1];
        } else if (lat == 0 && lng == 0) {
            lat = 12.9716;
            lng = 77.5946;
        }

        Ngo ngo = new Ngo();
        ngo.setId("NGO-" + UUID.randomUUID().toString().substring(0, 6));
        ngo.setName(dto.name);
        ngo.setPassword(dto.password);
        ngo.setLat(lat);
        ngo.setLng(lng);
        ngo.setCapacity(dto.capacity);
        ngo.setUsed(0);
        ngo.setResources(dto.resources != null ? dto.resources : new ArrayList<>());
        ngo.setColor("#" + Integer.toHexString(new Random().nextInt(0xffffff + 1)));
        ngo.setStatus("idle");
        ngo.setPhone(dto.phone);
        ngo.setSpecialization(dto.specialization);

        db.ngos.add(ngo);
        sseService.broadcast("ngoUpdate", db.ngos);

        return ResponseEntity.ok(Map.of("success", true, "ngo", ngo));
    }

    public static class NgoUpdateStockDto {
        public int addCapacity;
    }

    @PatchMapping("/ngos/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable String id, @RequestBody NgoUpdateStockDto dto) {
        Ngo ngo = db.ngos.stream().filter(n -> n.getId().equals(id)).findFirst().orElse(null);
        if (ngo == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "NGO not found"));
        }
        ngo.setCapacity(ngo.getCapacity() + dto.addCapacity);
        sseService.broadcast("ngoUpdate", db.ngos);
        return ResponseEntity.ok(Map.of("success", true, "ngo", ngo));
    }
    
    @PostMapping("/clear-requests")
    public ResponseEntity<?> clearRequests() {
        db.requests.clear();
        db.commsLog.clear();
        sseService.broadcast("init", Map.of(
            "type", "init",
            "ngos", db.ngos,
            "requests", db.requests,
            "commsLog", db.commsLog,
            "smsLog", db.smsLog
        ));
        return ResponseEntity.ok(Map.of("success", true));
    }
}

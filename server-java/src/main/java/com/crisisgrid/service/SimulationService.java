package com.crisisgrid.service;

import com.crisisgrid.model.*;
import com.crisisgrid.store.InMemoryDB;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SimulationService {

    @Autowired
    private InMemoryDB db;

    @Autowired
    private SseService sseService;

    private final Map<String, TrackingEntry> activeTracking = new ConcurrentHashMap<>();

    public void startTracking(Request request, Ngo ngo) {
        TrackingEntry t = new TrackingEntry();
        t.setReqId(request.getId());
        t.setNgoId(ngo.getId());
        t.setLat(ngo.getLat());
        t.setLng(ngo.getLng());
        int initialEta = request.getEta() != null ? request.getEta() : 5;
        t.setEta(initialEta); // store initial ETA here
        t.setProgress(0.0);
        
        activeTracking.put(request.getId() + "_" + ngo.getId(), t);

        addComms("to-user", "📱 → User [" + request.getId() + "]: Help is on the way! " + ngo.getName() + " dispatched.");
        addComms("to-ngo", "📡 → NGO [" + ngo.getName() + "]: Dispatch to " + request.getLoc() + ". ETA " + initialEta + "m.");
    }

    @Scheduled(fixedRate = 1000)
    public void simulationTick() {
        if (activeTracking.isEmpty()) return;

        activeTracking.forEach((key, t) -> {
            Request req = db.requests.stream().filter(r -> r.getId().equals(t.getReqId())).findFirst().orElse(null);
            Ngo ngo = db.ngos.stream().filter(n -> n.getId().equals(t.getNgoId())).findFirst().orElse(null);

            if (req == null || ngo == null || "completed".equals(req.getStatus())) {
                activeTracking.remove(key);
                return;
            }

            // Travel over ~50 seconds (1000ms tick = 50 steps)
            t.setProgress(t.getProgress() + 0.02);
            t.setLat(ngo.getLat() + (req.getLat() - ngo.getLat()) * t.getProgress());
            t.setLng(ngo.getLng() + (req.getLng() - ngo.getLng()) * t.getProgress());

            // Update remaining ETA
            int currentEta = Math.max(0, (int) Math.round((1.0 - t.getProgress()) * t.getEta()));
            req.setEta(currentEta);
            sseService.broadcast("requestUpdate", req);

            if (t.getProgress() >= 1.0) {
                t.setProgress(1.0);
                t.setLat(req.getLat());
                t.setLng(req.getLng());
                
                req.setStatus("completed");
                req.setCompletedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
                
                Request.AssignedNgo assigned = req.getAssigned().stream()
                    .filter(a -> a.getId().equals(ngo.getId())).findFirst().orElse(null);
                if (assigned != null) {
                    int consumed = assigned.getAssignedCount();
                    ngo.setCapacity(Math.max(0, ngo.getCapacity() - consumed));
                    ngo.setUsed(Math.max(0, ngo.getUsed() - consumed));
                    sseService.broadcast("ngoUpdate", db.ngos);
                }

                sseService.broadcast("requestUpdate", req);
                activeTracking.remove(key);

                addComms("to-user", "✅ → User [" + req.getId() + "]: Help has arrived at " + req.getLoc() + "!");
                addComms("to-ngo", "📡 → NGO [" + ngo.getName() + "]: On-site at " + req.getLoc() + ". Begin operations.");
            }

            sseService.broadcast("tracking", t);
        });
    }

    public void addComms(String type, String message) {
        CommsEntry entry = new CommsEntry(
            UUID.randomUUID().toString(),
            type,
            message,
            LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
        );
        db.commsLog.add(entry);
        if (db.commsLog.size() > 50) db.commsLog.remove(0);
        sseService.broadcast("comms", entry);
    }
}

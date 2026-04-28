package com.crisisgrid.controller;

import com.crisisgrid.service.SseService;
import com.crisisgrid.store.InMemoryDB;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SseController {

    @Autowired
    private SseService sseService;

    @Autowired
    private InMemoryDB db;

    @GetMapping("/events")
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // Infinite timeout
        sseService.addEmitter(emitter);

        try {
            Map<String, Object> initialData = new HashMap<>();
            initialData.put("type", "init");
            initialData.put("ngos", db.ngos);
            initialData.put("requests", db.requests);
            initialData.put("commsLog", db.commsLog);
            initialData.put("smsLog", db.smsLog);
            emitter.send(SseEmitter.event().name("init").data(initialData));
        } catch (Exception e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }
}

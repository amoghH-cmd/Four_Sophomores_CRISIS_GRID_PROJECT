package com.crisisgrid.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseService {
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public void addEmitter(SseEmitter emitter) {
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
    }

    public void broadcast(String eventName, Object data) {
        List<SseEmitter> deadEmitters = new java.util.ArrayList<>();
        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        });
        emitters.removeAll(deadEmitters);
    }
}

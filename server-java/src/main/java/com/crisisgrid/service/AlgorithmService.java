package com.crisisgrid.service;

import com.crisisgrid.model.Ngo;
import com.crisisgrid.model.Request;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AlgorithmService {

    private static final Map<String, double[]> AREA_COORDS = new LinkedHashMap<>();
    static {
        // Specific areas first
        AREA_COORDS.put("koramangala", new double[]{12.9279, 77.6271});
        AREA_COORDS.put("indiranagar", new double[]{12.9784, 77.6408});
        AREA_COORDS.put("whitefield", new double[]{12.9698, 77.7500});
        AREA_COORDS.put("jayanagar", new double[]{12.9277, 77.5937});
        AREA_COORDS.put("hebbal", new double[]{13.0358, 77.5970});
        AREA_COORDS.put("yelahanka", new double[]{13.1007, 77.5963});
        AREA_COORDS.put("btm", new double[]{12.9166, 77.6101});
        AREA_COORDS.put("hsr", new double[]{12.9082, 77.6476});
        AREA_COORDS.put("majestic", new double[]{12.9772, 77.5713});
        AREA_COORDS.put("electronic city", new double[]{12.8442, 77.6602});
        AREA_COORDS.put("marathahalli", new double[]{12.9591, 77.6974});
        AREA_COORDS.put("rajajinagar", new double[]{12.9850, 77.5516});
        AREA_COORDS.put("malleswaram", new double[]{13.0023, 77.5660});
        // City fallbacks last
        AREA_COORDS.put("bengaluru", new double[]{12.9716, 77.5946});
        AREA_COORDS.put("bangalore", new double[]{12.9716, 77.5946});
        AREA_COORDS.put("mumbai", new double[]{19.0760, 72.8777});
        AREA_COORDS.put("delhi", new double[]{28.7041, 77.1025});
    }

    public double[] geocode(String locStr) {
        if (locStr == null) return new double[]{12.9716, 77.5946};
        String lower = locStr.toLowerCase();
        
        for (Map.Entry<String, double[]> entry : AREA_COORDS.entrySet()) {
            String key = entry.getKey();
            // If it's a specific locality, allow substring match (e.g. "HSR Layout")
            // If it's a general city, ONLY match if it's the exact string, otherwise fallback to API
            if (key.equals("bengaluru") || key.equals("bangalore") || key.equals("mumbai") || key.equals("delhi")) {
                if (lower.equals(key)) return entry.getValue();
            } else {
                if (lower.contains(key)) return entry.getValue();
            }
        }

        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "CrisisGridApp/1.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            
            String url = "https://nominatim.openstreetmap.org/search?q=" + java.net.URLEncoder.encode(locStr, "UTF-8") + "&format=json&limit=1";
            org.springframework.http.ResponseEntity<java.util.List> response = restTemplate.exchange(
                url, org.springframework.http.HttpMethod.GET, entity, java.util.List.class);
                
            java.util.List<?> body = response.getBody();
            if (body != null && !body.isEmpty()) {
                java.util.Map<?, ?> first = (java.util.Map<?, ?>) body.get(0);
                double lat = Double.parseDouble(first.get("lat").toString());
                double lon = Double.parseDouble(first.get("lon").toString());
                return new double[]{lat, lon};
            }
        } catch (Exception e) {
            System.err.println("Geocoding failed for " + locStr + ": " + e.getMessage());
        }

        return new double[]{12.90 + Math.random() * 0.15, 77.55 + Math.random() * 0.20};
    }

    private static final Map<String, Integer> KEYWORD_SCORES = Map.ofEntries(
            Map.entry("trapped", 30), Map.entry("injured", 30), Map.entry("critical", 25), Map.entry("dying", 40),
            Map.entry("flood", 20), Map.entry("fire", 25), Map.entry("bleeding", 30), Map.entry("unconscious", 35),
            Map.entry("collapsed", 25), Map.entry("stranded", 20), Map.entry("no food", 15), Map.entry("starving", 20),
            Map.entry("urgent", 15), Map.entry("help", 5), Map.entry("crush", 28), Map.entry("drowning", 35), Map.entry("buried", 32)
    );

    public static class PriorityResult {
        public int score;
        public String priority;
        public PriorityResult(int score, String priority) {
            this.score = score;
            this.priority = priority;
        }
    }

    public PriorityResult calcPriority(String description, int people) {
        int score = 0;
        String d = description == null ? "" : description.toLowerCase();

        for (Map.Entry<String, Integer> entry : KEYWORD_SCORES.entrySet()) {
            if (d.contains(entry.getKey())) {
                score += entry.getValue();
            }
        }

        if (people >= 50) score += 40;
        else if (people >= 20) score += 25;
        else if (people >= 10) score += 15;
        else if (people >= 5) score += 8;

        String priority = score >= 50 ? "CRITICAL" : score >= 25 ? "HIGH" : "MEDIUM";
        return new PriorityResult(score, priority);
    }

    public double haversine(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static final Map<String, Integer> URGENCY_WEIGHT = Map.of("CRITICAL", 100, "HIGH", 60, "MEDIUM", 30);
    private static final double DIST_WEIGHT = 2.0;
    private static final double CAP_WEIGHT = 0.5;

    public List<Request.AssignedNgo> allocateNGOs(Request request, List<Ngo> ngos) {
        int urgencyW = URGENCY_WEIGHT.getOrDefault(request.getPriority(), 30);

        List<Request.AssignedNgo> eligible = ngos.stream()
                .filter(n -> n.getResources() != null && n.getResources().stream().anyMatch(r -> r.equalsIgnoreCase(request.getType())) && n.getUsed() < n.getCapacity())
                .map(n -> {
                    double dist = haversine(request.getLat(), request.getLng(), n.getLat(), n.getLng());
                    int avail = n.getCapacity() - n.getUsed();
                    double score = urgencyW - (DIST_WEIGHT * dist) + (CAP_WEIGHT * avail);
                    
                    return new Request.AssignedNgo(n.getId(), n.getName(), 0, dist, score);
                })
                .sorted((a, b) -> Double.compare(b.getAllocScore(), a.getAllocScore()))
                .collect(Collectors.toList());

        if (eligible.isEmpty()) return new ArrayList<>();

        int remaining = request.getPeople();
        List<Request.AssignedNgo> assigned = new ArrayList<>();
        
        for (Request.AssignedNgo aNgo : eligible) {
            if (remaining <= 0) break;
            
            Ngo actualNgo = ngos.stream().filter(n -> n.getId().equals(aNgo.getId())).findFirst().orElse(null);
            if (actualNgo == null) continue;
            
            int avail = actualNgo.getCapacity() - actualNgo.getUsed();
            int give = Math.min(avail, remaining);
            
            aNgo.setAssignedCount(give);
            assigned.add(aNgo);
            
            remaining -= give;
        }
        
        return assigned;
    }

    public boolean isDuplicate(double lat, double lng, String type, List<Request> existingRequests) {
        return existingRequests.stream().anyMatch(r -> 
            r.getType().equalsIgnoreCase(type) && 
            !"completed".equals(r.getStatus()) && 
            haversine(lat, lng, r.getLat(), r.getLng()) < 0.5
        );
    }

    public List<Request> findNearby(double lat, double lng, List<Request> existingRequests, double radiusKm) {
        return existingRequests.stream()
            .filter(r -> !"completed".equals(r.getStatus()) && haversine(lat, lng, r.getLat(), r.getLng()) < radiusKm)
            .collect(Collectors.toList());
    }
}

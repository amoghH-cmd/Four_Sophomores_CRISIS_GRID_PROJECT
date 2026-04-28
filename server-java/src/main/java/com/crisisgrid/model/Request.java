package com.crisisgrid.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Request {
    private String id;
    private String loc;
    private String type;
    private int people;
    private String description;
    private double lat;
    private double lng;
    private String priority;
    private int score;
    private String status = "pending";
    private List<AssignedNgo> assigned = new ArrayList<>();
    private Integer eta;
    private boolean isDuplicate;
    private int nearbyCount;
    private String ts;
    private String completedAt;
    private String source;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AssignedNgo {
        private String id;
        private String name;
        private int assignedCount;
        private double dist;
        private double allocScore;
    }
}

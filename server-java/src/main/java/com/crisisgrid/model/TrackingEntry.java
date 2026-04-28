package com.crisisgrid.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class TrackingEntry {
    public String reqId;
    public String ngoId;
    public double lat;
    public double lng;
    public int eta;
    public double progress;
}

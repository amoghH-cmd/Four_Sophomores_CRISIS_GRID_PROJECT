package com.crisisgrid.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class SmsLogEntry {
    private String id;
    private String ts;
    private String fromNumber;
    private String to;
    private String rawBody;
    private String status;
    private String reqId;
    private String error;
}

package com.crisisgrid.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor
public class CommsEntry {
    private String id;
    private String type;
    private String message;
    private String ts;
}

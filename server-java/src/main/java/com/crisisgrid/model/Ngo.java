package com.crisisgrid.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Ngo {
    private String id;
    private String name;
    private String password;
    private double lat;
    private double lng;
    private int capacity;
    private int used;
    private List<String> resources = new ArrayList<>();
    private String color;
    private String status = "idle";
    private String phone;
    private String specialization;
}

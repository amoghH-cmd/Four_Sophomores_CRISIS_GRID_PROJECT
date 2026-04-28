package com.crisisgrid.service;

import com.crisisgrid.model.Ngo;
import com.crisisgrid.store.InMemoryDB;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;

@Service
public class DataInitService {

    @Autowired
    private InMemoryDB db;

    @PostConstruct
    public void init() {
        // System starts empty. NGOs must register via the UI.
    }
}

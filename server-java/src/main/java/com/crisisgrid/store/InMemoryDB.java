package com.crisisgrid.store;

import com.crisisgrid.model.*;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class InMemoryDB {
    public final List<Request> requests = new CopyOnWriteArrayList<>();
    public final List<Ngo> ngos = new CopyOnWriteArrayList<>();
    public final List<CommsEntry> commsLog = new CopyOnWriteArrayList<>();
    public final List<SmsLogEntry> smsLog = new CopyOnWriteArrayList<>();
    
    public Ngo loginNgo(String name, String password) {
        return ngos.stream()
            .filter(n -> n.getName().equalsIgnoreCase(name) && n.getPassword().equals(password))
            .findFirst()
            .orElse(null);
    }
}

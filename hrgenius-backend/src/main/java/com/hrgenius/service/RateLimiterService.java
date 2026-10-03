package com.hrgenius.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class RateLimiterService {

    // Allow maximum 5 forgot-password requests within a 15-minute sliding window per client
    private static final int MAX_REQUESTS = 5;
    private static final long WINDOW_SECONDS = 15 * 60; // 15 minutes

    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Long>> requestHistory = new ConcurrentHashMap<>();

    /**
     * Attempts to acquire permission for an action associated with key.
     * @param key unique identifier (e.g., client IP or email)
     * @return true if request is allowed, false if rate limit is exceeded
     */
    public boolean allowRequest(String key) {
        long now = Instant.now().getEpochSecond();
        long windowStart = now - WINDOW_SECONDS;

        ConcurrentLinkedDeque<Long> timestamps = requestHistory.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        // Evict expired entries
        while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
            timestamps.pollFirst();
        }

        // Periodic cleanup of stale keys
        if (requestHistory.size() > 500) {
            cleanupStaleEntries(windowStart);
        }

        if (timestamps.size() >= MAX_REQUESTS) {
            return false;
        }

        timestamps.addLast(now);
        return true;
    }

    private void cleanupStaleEntries(long windowStart) {
        Iterator<String> it = requestHistory.keySet().iterator();
        while (it.hasNext()) {
            String k = it.next();
            ConcurrentLinkedDeque<Long> queue = requestHistory.get(k);
            if (queue != null && (queue.isEmpty() || queue.peekLast() < windowStart)) {
                requestHistory.remove(k);
            }
        }
    }
}

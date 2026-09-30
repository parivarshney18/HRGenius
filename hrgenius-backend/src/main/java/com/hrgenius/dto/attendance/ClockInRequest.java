package com.hrgenius.dto.attendance;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClockInRequest {
    private Long employeeId; // Optional: If null, inferred from authenticated token
    private String remarks;
}

package com.edu.chatbot.common.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Các hàm tiện ích dùng chung cho toàn hệ thống
 */
public class DateTimeUtils {
    
    private static final String DEFAULT_PATTERN = "yyyy-MM-dd HH:mm:ss";

    public static String format(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DateTimeFormatter.ofPattern(DEFAULT_PATTERN));
    }

    public static LocalDateTime parse(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ofPattern(DEFAULT_PATTERN));
    }
}

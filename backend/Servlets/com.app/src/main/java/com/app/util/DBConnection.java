package com.app.util;

import java.sql.DriverManager;
import java.sql.SQLException;

import com.sun.jdi.connect.spi.Connection;

public class DBConnection {
	private static final String URL = "jdbc:mysql://localhost:3306/student_db?useSSL=false";
	private static final String USER = "root";
	private static final String PASSWORD = "boot";
	static {
		try {
            Class.forName("com.mysql.cj.jdbc.Driver");
		}catch(ClassNotFoundException  e){
            throw new RuntimeException("MySQL Driver not found! Add JAR to WEB-INF/lib", e);
		}
	}
	public static Connection getConnection() throws SQLException {
        return (Connection) DriverManager.getConnection(URL, USER, PASSWORD);
    }
}

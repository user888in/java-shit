package com.app;

import java.sql.Connection;
import java.sql.DriverManager;

import jakarta.servlet.Servlet;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;

public class MyListener implements ServletContextListener {
	Connection cn;

	@Override
	public void contextInitialized(ServletContextEvent sce) {
		// TODO Auto-generated method stub
		try {
			Class.forName("com.mysql.cj.jdbc.Driver");
			cn = DriverManager.getConnection("jdbc:mysql://localhost:3306/mlk?autoReconnect=true&useSSL=false", "root",
					"Vinay@0011");
			ServletContext websiteInstance = sce.getServletContext();
			websiteInstance.setAttribute("connection", cn);
		} catch (Exception e) {
			// TODO: handle exception
		}

	}

	@Override
	public void contextDestroyed(ServletContextEvent sce) {
		// TODO Auto-generated method stub
		try {
			if (!cn.isClosed()) {
				cn.close();
			}
		} catch (Exception e) {
			// TODO: handle exception
		}
	}

}

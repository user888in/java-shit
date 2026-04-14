package com.app;

import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class Servlet extends HttpServlet {
	@Override
	public void init() throws ServletException {
		// TODO Auto-generated method stub
		super.init();
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		// TODO Auto-generated method stub
		PrintWriter out = resp.getWriter();
		out.println("Response from the server...");
		out.close();
		// 200 OK : Everything worked perfectly 
		// 201 Created : Resource created successfully
		// 301 Moved Permanently : Redirect forever
		// 302 Found : Temporary Redirect 
		// 400 Bad Request : Invalid Request or malformed request
		// 401 Unauthorized : Not logged in 
		// 403 Forbidden : Logged in but no permission
		// 404 Not Found : resource doen't exists 
		// 500 Internal Server Error : Server exceptions or errors
		
		String scheme = req.getScheme(); // http
		String host = req.getServerName(); // localhost
		int port = req.getServerPort(); 
		String contextPath = req.getContextPath(); 
		String servletPath = req.getServletPath();
		String queryString = req.getQueryString();
		// get individual query params
		String page = req.getParameter("page");
		String sort = req.getParameter("sort");
		int pageNum = Integer.parseInt(req.getParameter("page"));
		
		
	}
}

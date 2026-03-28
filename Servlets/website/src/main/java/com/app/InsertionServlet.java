package com.app;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;

import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

@MultipartConfig
public class InsertionServlet extends HttpServlet{
	Connection cn;
	@Override
	public void init(ServletConfig config) throws ServletException {
		// TODO Auto-generated method stub
		super.init(config);
		cn = (Connection) config.getServletContext().getAttribute("connection");
	}
	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		// TODO Auto-generated method stub
		try {
			String name = req.getParameter("text_name");
			Part imgPart = req.getPart("file_upload");
			InputStream ins = imgPart.getInputStream();
			PreparedStatement ps = cn.prepareStatement("insert into visual_data(name,image) values(?,?)");
			ps.setString(1, name);
			ps.setBlob(2, ins);
			int a = ps.executeUpdate();
			if(a>0) {
				PrintWriter out = resp.getWriter();
				out.println("File Uploaded");
				out.close();
			}
			
		} catch (Exception e) {
			// TODO: handle exception
		}
	}

}

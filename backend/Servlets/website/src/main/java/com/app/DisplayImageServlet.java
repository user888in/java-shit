package com.app;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class DisplayImageServlet extends HttpServlet {
	Connection cn;

	@Override
	public void init(ServletConfig config) throws ServletException {
		// TODO Auto-generated method stub
		super.init(config);
		cn = (Connection) config.getServletContext().getAttribute("connection");
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		// TODO Auto-generated method stub
		try {
			String idParam = req.getParameter("id");
			if (idParam == null || idParam.isEmpty()) {
				resp.getWriter().println("Invalid ID");
				return;
			}

			int id = Integer.parseInt(idParam);

		
			PreparedStatement ps = cn.prepareStatement("SELECT image FROM visual_data WHERE id = ?");
			ps.setInt(1, id);

			ResultSet rs = ps.executeQuery();

			if (rs.next()) {

				InputStream is = rs.getBinaryStream("image");
				OutputStream os = resp.getOutputStream();

				resp.setContentType("image/jpeg");

				byte[] buffer = new byte[4096];
				int bytesRead;

				while ((bytesRead = is.read(buffer)) != -1) {
					os.write(buffer, 0, bytesRead);
				}

				os.flush();
				os.close();
				is.close();

			} else {
				resp.getWriter().println("Image not found");
			}
		} catch (Exception e) {
			// TODO: handle exception
		}

	}

}

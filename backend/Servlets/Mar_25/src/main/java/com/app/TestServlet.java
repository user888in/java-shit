package com.app;

import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class TestServlet extends HttpServlet {
	@Override
	public void init() throws ServletException {
		// TODO Auto-generated method stub
		super.init();
	}
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		// TODO Auto-generated method stub
		PrintWriter out = resp.getWriter();
		resp.setContentType("text/xml");
		out.println("<html>");
			out.println("<head>");
				out.println("<title>MyTitle</title>");
			out.println("</head>");
			out.println("<body>");
				out.println("<b>");
					out.println("The received value is : "+req.getParameter("text_value"));
				out.println("</b>");
			out.println("</body>");
		out.println("</html>");

	}
}

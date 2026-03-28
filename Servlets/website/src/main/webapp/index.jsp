<%@page import="java.sql.Connection"%>
<html>
<body>
	<%
	Connection cn = (Connection) application.getAttribute("connection");
	if (!cn.isClosed()) {
		out.println("Database Connected");
	}
	ServletContext context = getServletContext();
	String user = context.getInitParameter("user");
	out.println("Global user: " + user);
	%>
	<div>
		<form method="post" action="Insertion.jsp">
			<input type="text" name="text_name"> 
			<input type="number" name="text_salary"> 
			<input type="submit" value="Insert">
		</form>
	</div>
</body>
</html>

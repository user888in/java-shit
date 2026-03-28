package com.app.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.app.model.Student;
import com.app.util.DBConnection;

public class StudentDAO {
    public void addStudent(Student student) throws SQLException {

        String sql = "INSERT INTO students (name, email, age, course) VALUES (?, ?, ?, ?)";

        try (
            Connection conn = (Connection) DBConnection.getConnection();

            PreparedStatement ps = conn.prepareStatement(sql)
        ) {
            ps.setString(1, student.getName());
            ps.setString(2, student.getEmail());
            ps.setInt(3, student.getAge());
            ps.setString(4, student.getCourse());

            ps.executeUpdate();
        }
    }


    public List<Student> getAllStudents() throws SQLException {
        List<Student> students = new ArrayList<>();

        String sql = "SELECT * FROM students ORDER BY name";

        try (
            Connection conn = (Connection) DBConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()
        ) {
            while (rs.next()) {
                Student s = new Student();
                s.setId(rs.getInt("id"));
                s.setName(rs.getString("name"));
                s.setEmail(rs.getString("email"));
                s.setAge(rs.getInt("age"));
                s.setCourse(rs.getString("course"));

                students.add(s);
            }
        }
        return students;
    }


   
    public Student getStudentById(int id) throws SQLException {
        String sql = "SELECT * FROM students WHERE id = ?";

        try (
            Connection conn = (Connection) DBConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)
        ) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Student(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getInt("age"),
                        rs.getString("course")
                    );
                }
            }
        }
        return null; 
    }

    public void updateStudent(Student student) throws SQLException {
        String sql = "UPDATE students SET name=?, email=?, age=?, course=? WHERE id=?";

        try (
            Connection conn = (Connection) DBConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)
        ) {
            ps.setString(1, student.getName());
            ps.setString(2, student.getEmail());
            ps.setInt(3, student.getAge());
            ps.setString(4, student.getCourse());
            ps.setInt(5, student.getId());  
            ps.executeUpdate();
        }
    }


   
    public void deleteStudent(int id) throws SQLException {
        String sql = "DELETE FROM students WHERE id = ?";
        try (
            Connection conn = (Connection) DBConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)
        ) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }
}

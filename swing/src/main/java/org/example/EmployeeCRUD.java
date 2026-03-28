package org.example;

import javax.swing.*;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.sql.*;
import java.util.Vector;

public class EmployeeCRUD extends JFrame {

    Connection connection;
    JLabel connectionLabel;

    JTable table;
    DefaultTableModel model;

    JTextField idField, nameField, salaryField, searchField;
    JButton addButton, updateButton, deleteButton, clearButton, searchBtn;

    private int selectedRow = -1;

    public void initComponents() {

        this.setLayout(new BorderLayout(15, 15));
        // operation panel
        JPanel operationPanel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 10, 5, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        operationPanel.setBorder(BorderFactory.createTitledBorder("Operation Panel"));
        gbc.gridx = 0;
        gbc.gridy = 0;
        operationPanel.add(new JLabel("Id: "), gbc);
        gbc.gridx = 1;
        idField = new JTextField(15);
        operationPanel.add(idField, gbc);
        gbc.gridx = 2;
        operationPanel.add(new JLabel("Name"), gbc);
        gbc.gridx = 3;
        nameField = new JTextField(15);
        operationPanel.add(nameField, gbc);
        gbc.gridx = 4;
        operationPanel.add(new JLabel("Salary"), gbc);
        gbc.gridx = 5;
        salaryField = new JTextField(15);
        operationPanel.add(salaryField, gbc);

        gbc.gridx = 0;
        gbc.gridy = 1;
        gbc.gridwidth = 6;
        gbc.anchor = GridBagConstraints.CENTER;
        JPanel buttonsPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 25, 15));
        addButton = new JButton("Add Employee");
        buttonsPanel.add(addButton, gbc);
        updateButton = new JButton("Update Employee");
        buttonsPanel.add(updateButton, gbc);
        deleteButton = new JButton("Delete Button");
        buttonsPanel.add(deleteButton, gbc);
        clearButton = new JButton("Clear Fields");
        buttonsPanel.add(clearButton, gbc);
        operationPanel.add(buttonsPanel, gbc);

        // -------- Search Row --------
        gbc.gridy = 2;
        gbc.gridx = 0;
        gbc.gridwidth = 1;
        operationPanel.add(new JLabel("Search Name:"), gbc);

        gbc.gridx = 1;
        gbc.gridwidth = 3;
        searchField = new JTextField(20);
        operationPanel.add(searchField, gbc);

        gbc.gridx = 4;
        gbc.gridwidth = 2;
        searchBtn = new JButton("Search");
        operationPanel.add(searchBtn, gbc);

        // table panel
        JPanel tablePanel = new JPanel();
        tablePanel.setBorder(BorderFactory.createTitledBorder("Info Panel"));
        connectionLabel = new JLabel("");
        connectionLabel.setHorizontalAlignment(SwingConstants.CENTER);
        connectionLabel.setBorder(BorderFactory.createEmptyBorder(0, 15, 15, 15));
        model = new DefaultTableModel() {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        table = new JTable(model);
        table.setRowHeight(20);
        JTableHeader header = table.getTableHeader();
        header.setBackground(Color.lightGray);
        header.setPreferredSize(new Dimension(0, 30));
        JScrollPane tableScrollPane = new JScrollPane(table);
        tableScrollPane.setPreferredSize(new Dimension(650, 250));
        tablePanel.add(tableScrollPane);
        this.getContentPane().add(operationPanel, BorderLayout.NORTH);
        this.getContentPane().add(tablePanel, BorderLayout.CENTER);
        this.getContentPane().add(connectionLabel, BorderLayout.SOUTH);

    }

    public void initEvent() {
        this.addWindowListener(new WindowAdapter() {
            @Override
            public void windowOpened(WindowEvent e) {
                openConnection();
                loadRecords("select * from employee");
            }

            @Override
            public void windowClosing(WindowEvent e) {
                closeConnection();
            }
        });
        table.getSelectionModel().addListSelectionListener(event -> {
            if (!event.getValueIsAdjusting()) {
                selectedRow = table.getSelectedRow();
                if (selectedRow != -1) {
                    idField.setText(table.getValueAt(selectedRow, 0).toString());
                    nameField.setText(table.getValueAt(selectedRow, 1).toString());
                    salaryField.setText(table.getValueAt(selectedRow, 2).toString());
                    idField.setEditable(false);
                }
            }
        });
        addButton.addActionListener(e -> addEmployee());
        updateButton.addActionListener(e -> updateEmployee());
        deleteButton.addActionListener(e -> deleteEmployee());
        clearButton.addActionListener(e -> clearFields());
        searchBtn.addActionListener(e -> liveSearch());

        searchField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                liveSearch();
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                liveSearch();
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                liveSearch();
            }
        });
    }

    public void loadRecords(String sql) {
        try {
            PreparedStatement preparedStatement = connection.prepareStatement(sql);
            ResultSet resultSet = preparedStatement.executeQuery();
            Vector colnames = new Vector();
            Vector records = new Vector();
            for (int i = 1; i <= resultSet.getMetaData().getColumnCount(); i++) {
                colnames.add(resultSet.getMetaData().getColumnLabel(i));
            }
            while (resultSet.next()) {
                Vector temp = new Vector();
                for (int i = 1; i <= resultSet.getMetaData().getColumnCount(); i++) {
                    temp.add(resultSet.getString(i));
                }
                records.add(temp);
            }
            model.setDataVector(records, colnames);
            table.setModel(model);
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Failed to load records");
        }
    }

    public void loadRecords(String sql, String param) {
        try {
            PreparedStatement ps = connection.prepareStatement(sql);
            ps.setString(1, "%" + param + "%");   // set parameter here

            ResultSet rs = ps.executeQuery();

            Vector<String> colnames = new Vector<>();
            Vector<Vector<String>> records = new Vector<>();

            ResultSetMetaData meta = rs.getMetaData();
            int columnCount = meta.getColumnCount();

            for (int i = 1; i <= columnCount; i++) {
                colnames.add(meta.getColumnLabel(i));
            }

            while (rs.next()) {
                Vector<String> row = new Vector<>();
                for (int i = 1; i <= columnCount; i++) {
                    row.add(rs.getString(i));
                }
                records.add(row);
            }

            model.setDataVector(records, colnames);

            ps.close();

        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Search failed");
            e.printStackTrace();
        }
    }

    public void addEmployee() {
        String id = idField.getText().trim();
        String name = nameField.getText().trim();
        String salary = salaryField.getText().trim();
        if (id.isEmpty() || name.isEmpty() || salary.isEmpty()) {
            JOptionPane.showMessageDialog(this, "All fields are required");
            return;
        }
        try {
            String sql = "insert into employee (code,name,salary) values(?,?,?)";
            PreparedStatement preparedStatement = connection.prepareStatement(sql);
            preparedStatement.setInt(1, Integer.parseInt(id));
            preparedStatement.setString(2, name);
            preparedStatement.setDouble(3, Double.parseDouble(salary));
            int rowsAffected = preparedStatement.executeUpdate();
            if (rowsAffected > 0) {
                JOptionPane.showMessageDialog(this, "Employee added successfully");
                loadRecords("select * from employee");
                clearFields();
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error adding employee");
            e.printStackTrace();
        }
    }

    public void updateEmployee() {
        String id = idField.getText().trim();
        String name = nameField.getText().trim();
        String salary = salaryField.getText().trim();
        if (id.isEmpty() || name.isEmpty() || salary.isEmpty()) {
            JOptionPane.showMessageDialog(this, "All fields are required");
            return;
        }
        try {
            String sql = "update employee set name = ?, salary = ? where code = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(sql);
            preparedStatement.setString(1, name);
            preparedStatement.setDouble(2, Double.parseDouble(salary));
            preparedStatement.setInt(3, Integer.parseInt(id));
            int rowsAffected = preparedStatement.executeUpdate();
            if (rowsAffected > 0) {
                JOptionPane.showMessageDialog(this, "Employee updated successfully");
                loadRecords("select * from employee");
                clearFields();
            } else {
                JOptionPane.showMessageDialog(this, "No employee found with this id");
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error updating employee");
            e.printStackTrace();
        }
    }

    public void deleteEmployee() {
        String id = idField.getText().trim();
        if (id.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please select an employee to delete");
        }
        int confirm = JOptionPane.showConfirmDialog(this, "Are you sure you want to delete", "Confirm Delete", JOptionPane.YES_NO_OPTION);
        if (confirm != JOptionPane.YES_OPTION) {
            return;
        }
        try {
            String sql = "delete from employee where code = ?";
            PreparedStatement preparedStatement = connection.prepareStatement(sql);
            preparedStatement.setInt(1, Integer.parseInt(id));
            int rowsAffected = preparedStatement.executeUpdate();
            if (rowsAffected > 0) {
                JOptionPane.showMessageDialog(this, "Employee deleted successfully");
                loadRecords("select * from employee");
                clearFields();
            } else {
                JOptionPane.showMessageDialog(this, "No employee found with this id");
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "Error deleting employee");
            e.printStackTrace();
        }
    }

    public void clearFields() {
        idField.setText("");
        nameField.setText("");
        salaryField.setText("");
        idField.setEditable(true);
    }

    public void liveSearch() {
        String searchTerm = searchField.getText().trim();
        if (searchTerm.isEmpty()) {
            loadRecords("select * from employee");
            return;
        }

        String sql = "select * from employee where name like ?";
        loadRecords(sql, searchTerm);
    }

    public void openConnection() {
        try {
            connection = DriverManager.getConnection("jdbc:mysql://127.0.0.1:3306/mlk?autoReconnect=true&useSSL=false", "root", "Vinay@0011");
            if (!connection.isClosed()) {
                connectionLabel.setText("Database Connected");
            }
        } catch (SQLException e) {
            connectionLabel.setText("Database not Connected");
            throw new RuntimeException("Failed to connect db", e);
        }
    }

    public void closeConnection() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
                connectionLabel.setText("Database Disconnected");
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to close connection", e);
        }
    }

    public EmployeeCRUD() {
        this.initComponents();
        initEvent();
        this.setTitle("Employee CRUD");
        this.setLocation(200, 200);
        this.setResizable(false);
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.pack();
        this.setVisible(true);

    }

    public static void main(String args[]) {
        EmployeeCRUD obj = new EmployeeCRUD();
    }
}

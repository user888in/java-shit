package org.example;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;

public class TableExample extends JFrame {
    JTable table;
    DefaultTableModel tableModel;

    public void initComponents() {
        String[] header = {"ID", "Name", "Age", "Salary"};
        tableModel = new DefaultTableModel(header, 0);
        tableModel.addRow(new Object[]{1, "Alex", 25, 230000});
        tableModel.addRow(new Object[]{2, "Harry", 28, 290000});
        tableModel.addRow(new Object[]{3, "Bolt", 20, 250000});
        table = new JTable(tableModel);
        JScrollPane scrollPane = new JScrollPane(table);
        scrollPane.setBorder(
                BorderFactory.createCompoundBorder(
                        BorderFactory.createTitledBorder(BorderFactory.createLineBorder(Color.BLACK, 2), "Employee Data"),
                        BorderFactory.createEmptyBorder(10, 10, 10, 10)
                )
        );
        JPanel panel = new JPanel();
        panel.add(scrollPane);
        this.getContentPane().add(panel);
    }

    public TableExample() {
        this.initComponents();
        this.setTitle("Table Window");
        this.setLocation(200, 200);
        this.setVisible(true);
        this.setResizable(false);
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.pack();
    }

    public static void main(String args[]) {
        TableExample tableExample = new TableExample();
    }
}

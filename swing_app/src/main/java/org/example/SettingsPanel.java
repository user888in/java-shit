package org.example;
import javax.swing.*;
import java.awt.*;

public class SettingsPanel extends JPanel {

    public SettingsPanel(MainFrame frame) {
        setLayout(new BorderLayout());

        JLabel title = new JLabel("Settings Page", JLabel.CENTER);
        title.setFont(new Font("Arial", Font.BOLD, 24));

        JButton backButton = new JButton("Back to Dashboard");

        backButton.addActionListener(e -> {
            frame.showPage(MainFrame.DASHBOARD);
        });

        add(title, BorderLayout.CENTER);
        add(backButton, BorderLayout.SOUTH);
    }
}
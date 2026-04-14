# Java Logic Patterns — Complete Practice Guide

> This is your reference sheet. Every pattern here appears repeatedly in real projects.
> Master these and you can build anything.

---

## Table of Contents

1. [Input Validation Patterns](#1-input-validation-patterns)
2. [Database Query Patterns](#2-database-query-patterns)
3. [Existence & Duplicate Check Patterns](#3-existence--duplicate-check-patterns)
4. [Transaction Patterns](#4-transaction-patterns)
5. [Controller Response Patterns](#5-controller-response-patterns)
6. [List & Search Patterns](#6-list--search-patterns)
7. [Status Flow Patterns](#7-status-flow-patterns)
8. [Role & Access Patterns](#8-role--access-patterns)
9. [Date & Time Patterns](#9-date--time-patterns)
10. [ID Generation Patterns](#10-id-generation-patterns)
11. [Password & Security Patterns](#11-password--security-patterns)
12. [UI → Controller → DAO Flow Pattern](#12-ui--controller--dao-flow-pattern)
13. [Error Handling Patterns](#13-error-handling-patterns)
14. [The 10 Questions Checklist](#14-the-10-questions-checklist)
15. [Practice Exercises](#15-practice-exercises)

---

## 1. Input Validation Patterns

> Always validate BEFORE touching the database. Top to bottom. Most critical first.

### Empty / Null Check
```java
// Single field
if (name == null || name.trim().isEmpty())
    return "ERROR: Name is required.";

// Multiple fields at once
if (name.isEmpty() || phone.isEmpty() || email.isEmpty())
    return "ERROR: Please fill in all required fields.";
```

### Minimum Length Check
```java
if (phone.trim().length() < 10)
    return "ERROR: Phone must be at least 10 digits.";

if (password.length() < 6)
    return "ERROR: Password must be at least 6 characters.";
```

### Numeric Check
```java
// Check if a string is a valid number
try {
    int age = Integer.parseInt(ageStr);
    if (age <= 0 || age > 150)
        return "ERROR: Enter a valid age.";
} catch (NumberFormatException e) {
    return "ERROR: Age must be a number.";
}

// Check if decimal is valid
try {
    double amount = Double.parseDouble(amountStr);
    if (amount <= 0)
        return "ERROR: Amount must be greater than zero.";
} catch (NumberFormatException e) {
    return "ERROR: Enter a valid amount.";
}
```

### Format Check (Date)
```java
try {
    LocalDate date = LocalDate.parse(dateStr); // expects YYYY-MM-DD
} catch (DateTimeParseException e) {
    return "ERROR: Date must be in format YYYY-MM-DD.";
}
```

### Format Check (Email)
```java
if (!email.contains("@") || !email.contains("."))
    return "ERROR: Enter a valid email address.";
```

### Range Check
```java
if (quantity < 1 || quantity > 1000)
    return "ERROR: Quantity must be between 1 and 1000.";
```

### Dropdown / Selection Check
```java
// ComboBox — index 0 is always the empty "Select..." option
if (genderBox.getSelectedIndex() == 0)
    return "ERROR: Please select a gender.";

// Object selection
if (selectedDoctor == null)
    return "ERROR: Please select a doctor.";
```

---

## 2. Database Query Patterns

> Every DAO method follows one of these patterns. Learn them by heart.

### SELECT — Get One Row
```java
public Patient getPatientById(int id) {
    String query = "SELECT * FROM patients WHERE patient_id = ?";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setInt(1, id);
        ResultSet rs = ps.executeQuery();
        if (rs.next()) {
            return mapRow(rs); // convert row to object
        }
    } catch (SQLException e) {
        System.out.println("getPatientById error: " + e.getMessage());
    }
    return null; // not found
}
```

### SELECT — Get Many Rows
```java
public List<Patient> getAllPatients() {
    List<Patient> list = new ArrayList<>();
    String query = "SELECT * FROM patients ORDER BY name ASC";
    try (Statement st = conn.createStatement();
         ResultSet rs = st.executeQuery(query)) {
        while (rs.next()) {
            list.add(mapRow(rs));
        }
    } catch (SQLException e) {
        System.out.println("getAllPatients error: " + e.getMessage());
    }
    return list; // returns empty list if nothing found, never null
}
```

### SELECT — Count (for duplicate/existence check)
```java
public boolean isPhoneDuplicate(String phone) {
    String query = "SELECT COUNT(*) FROM patients WHERE phone = ?";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setString(1, phone);
        ResultSet rs = ps.executeQuery();
        if (rs.next()) return rs.getInt(1) > 0;
    } catch (SQLException e) {
        System.out.println("isPhoneDuplicate error: " + e.getMessage());
    }
    return false;
}
```

### INSERT — Add New Row
```java
public boolean addPatient(Patient p) {
    String query = "INSERT INTO patients (name, phone, gender) VALUES (?, ?, ?)";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setString(1, p.getName());
        ps.setString(2, p.getPhone());
        ps.setString(3, p.getGender());
        return ps.executeUpdate() > 0; // returns true if 1+ rows inserted
    } catch (SQLException e) {
        System.out.println("addPatient error: " + e.getMessage());
        return false;
    }
}
```

### INSERT — Get Generated ID Back
```java
public int addAndGetId(Patient p) {
    String query = "INSERT INTO patients (name, phone) VALUES (?, ?)";
    try (PreparedStatement ps = conn.prepareStatement(query, 
                                Statement.RETURN_GENERATED_KEYS)) {
        ps.setString(1, p.getName());
        ps.setString(2, p.getPhone());
        ps.executeUpdate();
        ResultSet keys = ps.getGeneratedKeys();
        if (keys.next()) return keys.getInt(1); // returns the new ID
    } catch (SQLException e) {
        System.out.println("addAndGetId error: " + e.getMessage());
    }
    return -1; // failed
}
```

### UPDATE — Modify Existing Row
```java
public boolean updatePatient(Patient p) {
    String query = "UPDATE patients SET name = ?, phone = ? WHERE patient_id = ?";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setString(1, p.getName());
        ps.setString(2, p.getPhone());
        ps.setInt(3, p.getPatientId());
        return ps.executeUpdate() > 0;
    } catch (SQLException e) {
        System.out.println("updatePatient error: " + e.getMessage());
        return false;
    }
}
```

### UPDATE — Single Field Only
```java
public boolean updateStatus(int appointmentId, String status) {
    String query = "UPDATE appointments SET status = ? WHERE appointment_id = ?";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setString(1, status);
        ps.setInt(2, appointmentId);
        return ps.executeUpdate() > 0;
    } catch (SQLException e) {
        System.out.println("updateStatus error: " + e.getMessage());
        return false;
    }
}
```

### mapRow — Convert ResultSet to Object
```java
// Always write this private helper in every DAO
private Patient mapRow(ResultSet rs) throws SQLException {
    Patient p = new Patient();
    p.setPatientId(rs.getInt("patient_id"));
    p.setName(rs.getString("name"));
    p.setPhone(rs.getString("phone"));
    p.setGender(rs.getString("gender"));
    // handle nullable date
    Date dob = rs.getDate("dob");
    if (dob != null) p.setDob(dob.toLocalDate());
    return p;
}
```

---

## 3. Existence & Duplicate Check Patterns

> Always check BEFORE inserting. Never assume.

### Does this record exist?
```java
public boolean patientExists(int patientId) {
    String query = "SELECT COUNT(*) FROM patients WHERE patient_id = ?";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setInt(1, patientId);
        ResultSet rs = ps.executeQuery();
        if (rs.next()) return rs.getInt(1) > 0;
    } catch (SQLException e) {
        System.out.println("patientExists error: " + e.getMessage());
    }
    return false;
}
```

### Is this value already taken? (Unique check)
```java
public boolean isUsernameTaken(String username) {
    String query = "SELECT COUNT(*) FROM users WHERE username = ?";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setString(1, username);
        ResultSet rs = ps.executeQuery();
        if (rs.next()) return rs.getInt(1) > 0;
    } catch (SQLException e) {
        System.out.println("isUsernameTaken error: " + e.getMessage());
    }
    return false;
}
```

### Is this slot available? (Conflict check)
```java
public boolean isSlotTaken(int doctorId, String date, String time) {
    String query = "SELECT COUNT(*) FROM appointments " +
                   "WHERE doctor_id = ? AND appointment_date = ? " +
                   "AND appointment_time = ? AND status != 'Cancelled'";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setInt(1, doctorId);
        ps.setDate(2, Date.valueOf(date));
        ps.setTime(3, Time.valueOf(time));
        ResultSet rs = ps.executeQuery();
        if (rs.next()) return rs.getInt(1) > 0;
    } catch (SQLException e) {
        System.out.println("isSlotTaken error: " + e.getMessage());
    }
    return false;
}
```

### Has this already been processed? (Flag check)
```java
public boolean isAlreadyDispensed(int prescriptionId) {
    String query = "SELECT is_dispensed FROM prescriptions WHERE prescription_id = ?";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setInt(1, prescriptionId);
        ResultSet rs = ps.executeQuery();
        if (rs.next()) return rs.getBoolean("is_dispensed");
    } catch (SQLException e) {
        System.out.println("isAlreadyDispensed error: " + e.getMessage());
    }
    return false;
}
```

---

## 4. Transaction Patterns

> Use whenever you write to MORE THAN ONE table. All or nothing.

### Basic Transaction (2 tables)
```java
public boolean completeAppointment(int appointmentId, String diagnosis) {
    try {
        conn.setAutoCommit(false); // START transaction

        // Step 1 — update appointments
        String q1 = "UPDATE appointments SET status = 'Completed' WHERE appointment_id = ?";
        PreparedStatement ps1 = conn.prepareStatement(q1);
        ps1.setInt(1, appointmentId);
        ps1.executeUpdate();

        // Step 2 — insert medical record
        String q2 = "INSERT INTO medical_records (appointment_id, diagnosis) VALUES (?, ?)";
        PreparedStatement ps2 = conn.prepareStatement(q2);
        ps2.setInt(1, appointmentId);
        ps2.setString(2, diagnosis);
        ps2.executeUpdate();

        conn.commit(); // SAVE everything
        return true;

    } catch (SQLException e) {
        try {
            conn.rollback(); // UNDO everything if anything failed
        } catch (SQLException ex) {
            System.out.println("Rollback error: " + ex.getMessage());
        }
        System.out.println("Transaction error: " + e.getMessage());
        return false;

    } finally {
        try {
            conn.setAutoCommit(true); // ALWAYS restore this
        } catch (SQLException e) {
            System.out.println("AutoCommit restore error: " + e.getMessage());
        }
    }
}
```

### Transaction with Loop (insert multiple rows)
```java
public boolean createPrescription(Prescription p, List<PrescriptionItem> items) {
    try {
        conn.setAutoCommit(false);

        // Insert prescription header — get its ID back
        String q1 = "INSERT INTO prescriptions (patient_id, doctor_id, prescribed_date) VALUES (?, ?, ?)";
        PreparedStatement ps1 = conn.prepareStatement(q1, Statement.RETURN_GENERATED_KEYS);
        ps1.setInt(1, p.getPatientId());
        ps1.setInt(2, p.getDoctorId());
        ps1.setDate(3, Date.valueOf(p.getPrescribedDate()));
        ps1.executeUpdate();

        // Get the new prescription ID
        ResultSet keys = ps1.getGeneratedKeys();
        int prescriptionId = -1;
        if (keys.next()) prescriptionId = keys.getInt(1);

        // Insert each medicine item
        String q2 = "INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration) VALUES (?, ?, ?, ?, ?)";
        PreparedStatement ps2 = conn.prepareStatement(q2);
        for (PrescriptionItem item : items) {
            ps2.setInt(1, prescriptionId);
            ps2.setString(2, item.getMedicineName());
            ps2.setString(3, item.getDosage());
            ps2.setString(4, item.getFrequency());
            ps2.setString(5, item.getDuration());
            ps2.executeUpdate();
        }

        conn.commit();
        return true;

    } catch (SQLException e) {
        try { conn.rollback(); } catch (SQLException ex) { }
        System.out.println("createPrescription error: " + e.getMessage());
        return false;
    } finally {
        try { conn.setAutoCommit(true); } catch (SQLException e) { }
    }
}
```

---

## 5. Controller Response Patterns

> Controllers always return a String message. UI reads it and reacts.

### The Standard Pattern
```java
public String doSomething(String input) {
    // 1. Validate inputs
    if (input == null || input.isEmpty())
        return "ERROR: Input is required.";

    // 2. Check business rules
    if (dao.alreadyExists(input))
        return "ERROR: This already exists.";

    // 3. Save
    boolean saved = dao.save(input);

    // 4. Return result
    if (saved)
        return "SUCCESS: Saved successfully.";
    else
        return "ERROR: Failed to save. Please try again.";
}
```

### Reading the Response in UI
```java
String result = controller.doSomething(inputField.getText());

if (result.startsWith("SUCCESS")) {
    statusLabel.setForeground(new Color(0, 130, 0)); // green
    statusLabel.setText(result.replace("SUCCESS: ", ""));
    clearForm();
} else {
    statusLabel.setForeground(Color.RED);
    statusLabel.setText(result.replace("ERROR: ", ""));
}
```

---

## 6. List & Search Patterns

> Loading data into a JTable. Used in every list screen.

### Load All into JTable
```java
private void loadAllPatients() {
    tableModel.setRowCount(0); // clear existing rows first
    List<Patient> patients = controller.getAllPatients();
    for (Patient p : patients) {
        tableModel.addRow(new Object[]{
            p.getPatientCode(),
            p.getName(),
            p.getGender(),
            p.getPhone()
        });
    }
    countLabel.setText("Showing " + patients.size() + " patients");
}
```

### Search and Reload Table
```java
private void handleSearch() {
    String query = searchField.getText().trim();
    tableModel.setRowCount(0);

    List<Patient> results;
    if (query.isEmpty()) {
        results = controller.getAllPatients();
    } else {
        results = controller.searchPatients(query);
    }

    for (Patient p : results) {
        tableModel.addRow(new Object[]{
            p.getPatientCode(),
            p.getName(),
            p.getGender(),
            p.getPhone()
        });
    }
    countLabel.setText("Showing " + results.size() + " results");
}
```

### Search SQL Pattern (LIKE)
```java
public List<Patient> searchPatients(String query) {
    List<Patient> list = new ArrayList<>();
    String sql = "SELECT * FROM patients WHERE name LIKE ? OR phone LIKE ?";
    try (PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, "%" + query + "%"); // % means "anything before"
        ps.setString(2, "%" + query + "%"); // % means "anything after"
        ResultSet rs = ps.executeQuery();
        while (rs.next()) list.add(mapRow(rs));
    } catch (SQLException e) {
        System.out.println("searchPatients error: " + e.getMessage());
    }
    return list;
}
```

### Get Selected Row from JTable
```java
table.addMouseListener(new MouseAdapter() {
    public void mouseClicked(MouseEvent e) {
        int row = table.getSelectedRow();
        if (row == -1) return; // nothing selected

        // read values from selected row
        String code = (String) tableModel.getValueAt(row, 0);
        String name = (String) tableModel.getValueAt(row, 1);

        // do something with them
        showPatientDetails(code, name);
    }
});
```

---

## 7. Status Flow Patterns

> Records move through states. Always control which transitions are allowed.

### Allowed Transitions
```java
// Appointments: Scheduled → Completed or Cancelled
// Never: Completed → Scheduled

public String updateAppointmentStatus(int id, String newStatus) {
    Appointment a = appointmentDAO.getAppointmentById(id);
    if (a == null)
        return "ERROR: Appointment not found.";

    // Control allowed transitions
    if (a.getStatus().equals("Completed"))
        return "ERROR: Cannot change a completed appointment.";
    if (a.getStatus().equals("Cancelled") && newStatus.equals("Completed"))
        return "ERROR: Cannot complete a cancelled appointment.";

    boolean updated = appointmentDAO.updateStatus(id, newStatus);
    if (updated)
        return "SUCCESS: Status updated to " + newStatus;
    else
        return "ERROR: Failed to update status.";
}
```

### Payment Status Flow
```java
// Pending → Partial → Paid
public String processPayment(int billId, double amountPaid) {
    Bill bill = billingDAO.getBillById(billId);
    if (bill == null)
        return "ERROR: Bill not found.";
    if (bill.getPaymentStatus().equals("Paid"))
        return "ERROR: This bill is already fully paid.";
    if (amountPaid <= 0)
        return "ERROR: Amount must be greater than zero.";
    if (amountPaid > (bill.getTotalAmount() - bill.getPaidAmount()))
        return "ERROR: Amount exceeds remaining balance.";

    double newPaidAmount = bill.getPaidAmount() + amountPaid;
    String newStatus = (newPaidAmount >= bill.getTotalAmount()) ? "Paid" : "Partial";

    boolean updated = billingDAO.processPayment(billId, newPaidAmount, newStatus);
    if (updated)
        return "SUCCESS: Payment processed. Status: " + newStatus;
    else
        return "ERROR: Payment failed. Please try again.";
}
```

---

## 8. Role & Access Patterns

> Check role before doing anything sensitive.

### Role Check in Controller
```java
public String deleteRecord(int recordId) {
    // Only admin can delete
    if (!SessionManager.getRole().equals("admin"))
        return "ERROR: You do not have permission to do this.";

    boolean deleted = dao.delete(recordId);
    return deleted ? "SUCCESS: Deleted." : "ERROR: Could not delete.";
}
```

### Role Check Helper Method
```java
private boolean hasAccess(String... allowedRoles) {
    String currentRole = SessionManager.getRole();
    for (String role : allowedRoles) {
        if (currentRole.equals(role)) return true;
    }
    return false;
}

// Usage
if (!hasAccess("admin", "doctor"))
    return "ERROR: Access denied.";
```

### Role Check in UI Panel
```java
public class BillingPanel extends JPanel {
    public BillingPanel() {
        // Double check at panel level too
        String role = SessionManager.getRole();
        if (!role.equals("admin") && !role.equals("receptionist")) {
            setLayout(new GridBagLayout());
            add(new JLabel("Access Denied"));
            return;
        }
        // normal init
        initUI();
    }
}
```

---

## 9. Date & Time Patterns

> Dates are tricky. Always use LocalDate/LocalTime internally, convert at DB boundary.

### String → LocalDate
```java
try {
    LocalDate date = LocalDate.parse("2026-02-19"); // YYYY-MM-DD
} catch (DateTimeParseException e) {
    return "ERROR: Invalid date format. Use YYYY-MM-DD.";
}
```

### LocalDate → SQL Date (for DAO)
```java
ps.setDate(1, Date.valueOf(localDate));
```

### SQL Date → LocalDate (from ResultSet)
```java
Date sqlDate = rs.getDate("appointment_date");
LocalDate date = (sqlDate != null) ? sqlDate.toLocalDate() : null;
```

### Is Date in the Past?
```java
if (selectedDate.isBefore(LocalDate.now()))
    return "ERROR: Cannot book a date in the past.";
```

### Get Day of Week from Date
```java
LocalDate date = LocalDate.parse("2026-02-19");
String day = date.getDayOfWeek().toString(); // "THURSDAY"
```

### Format Date for Display
```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
String display = localDate.format(formatter); // "19 Feb 2026"
```

---

## 10. ID Generation Patterns

> Never use random IDs. Always sequential and readable.

### Generate Next Sequential Code (PAT-0001 style)
```java
public String generatePatientCode() {
    String query = "SELECT patient_code FROM patients ORDER BY patient_id DESC LIMIT 1";
    try (Statement st = conn.createStatement();
         ResultSet rs = st.executeQuery(query)) {
        if (rs.next()) {
            String last = rs.getString("patient_code"); // e.g. PAT-0042
            int number = Integer.parseInt(last.substring(4)) + 1;
            return String.format("PAT-%04d", number); // PAT-0043
        }
    } catch (SQLException e) {
        System.out.println("generatePatientCode error: " + e.getMessage());
    }
    return "PAT-0001"; // first patient
}
```

### Format Number with Leading Zeros
```java
String.format("PAT-%04d", 7);   // PAT-0007
String.format("BILL-%05d", 42); // BILL-00042
String.format("LAB-%03d", 100); // LAB-100
```

---

## 11. Password & Security Patterns

> Never store plain text passwords. Ever.

### Hash Password Before Saving
```java
// Using a simple SHA-256 hash (use BCrypt in production)
import java.security.MessageDigest;

public static String hashPassword(String password) {
    try {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(password.getBytes());
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    } catch (Exception e) {
        return password; // fallback — not ideal
    }
}
```

### Verify Password
```java
public static boolean checkPassword(String inputPassword, String storedHash) {
    return hashPassword(inputPassword).equals(storedHash);
}
```

### Use in AuthController
```java
// When logging in
User user = authDAO.getUserByUsername(username);
if (!PasswordUtils.checkPassword(password, user.getPassword()))
    return "ERROR: Incorrect password.";

// When registering a new user
String hashed = PasswordUtils.hashPassword(rawPassword);
user.setPassword(hashed);
userDAO.addUser(user);
```

---

## 12. UI → Controller → DAO Flow Pattern

> This is the MVC flow. Every feature follows this exact path.

```
Button clicked in View
        ↓
View reads field values
        ↓
View calls Controller method with those values
        ↓
Controller validates inputs
        ↓
Controller calls DAO to check rules (SELECT)
        ↓
Controller calls DAO to save (INSERT/UPDATE)
        ↓
Controller returns "SUCCESS:..." or "ERROR:..."
        ↓
View reads the result
        ↓
View shows green message or red message
```

### Complete Example — Add Medicine
```java
// ── VIEW ─────────────────────────────────
saveBtn.addActionListener(e -> {
    String result = controller.addMedicine(
        nameField.getText(),
        categoryField.getText(),
        priceField.getText(),
        stockField.getText()
    );
    if (result.startsWith("SUCCESS")) {
        statusLabel.setForeground(new Color(0, 130, 0));
        statusLabel.setText(result.replace("SUCCESS: ", ""));
        clearForm();
        loadMedicines(); // refresh table
    } else {
        statusLabel.setForeground(Color.RED);
        statusLabel.setText(result.replace("ERROR: ", ""));
    }
});

// ── CONTROLLER ───────────────────────────
public String addMedicine(String name, String category, 
                           String priceStr, String stockStr) {
    if (name.trim().isEmpty())
        return "ERROR: Medicine name is required.";

    double price;
    try {
        price = Double.parseDouble(priceStr);
        if (price < 0) return "ERROR: Price cannot be negative.";
    } catch (NumberFormatException e) {
        return "ERROR: Price must be a number.";
    }

    int stock;
    try {
        stock = Integer.parseInt(stockStr);
        if (stock < 0) return "ERROR: Stock cannot be negative.";
    } catch (NumberFormatException e) {
        return "ERROR: Stock must be a whole number.";
    }

    if (medicineDAO.isMedicineNameDuplicate(name.trim()))
        return "ERROR: A medicine with this name already exists.";

    Medicine m = new Medicine();
    m.setName(name.trim());
    m.setCategory(category.trim());
    m.setPrice(price);
    m.setStockQuantity(stock);

    boolean saved = medicineDAO.addMedicine(m);
    if (saved)
        return "SUCCESS: Medicine added successfully.";
    else
        return "ERROR: Failed to save. Please try again.";
}

// ── DAO ──────────────────────────────────
public boolean addMedicine(Medicine m) {
    String query = "INSERT INTO medicines (name, category, price, stock_quantity) " +
                   "VALUES (?, ?, ?, ?)";
    try (PreparedStatement ps = conn.prepareStatement(query)) {
        ps.setString(1, m.getName());
        ps.setString(2, m.getCategory());
        ps.setDouble(3, m.getPrice());
        ps.setInt(4, m.getStockQuantity());
        return ps.executeUpdate() > 0;
    } catch (SQLException e) {
        System.out.println("addMedicine error: " + e.getMessage());
        return false;
    }
}
```

---

## 13. Error Handling Patterns

> Never let the app crash silently. Always catch and communicate.

### DAO — Always Catch SQLException
```java
try (PreparedStatement ps = conn.prepareStatement(query)) {
    // ...
} catch (SQLException e) {
    System.out.println("methodName error: " + e.getMessage());
    return false; // or null or empty list
}
```

### Controller — Catch Unexpected Exceptions
```java
public String doSomething(String input) {
    try {
        // your logic here
        return "SUCCESS: Done.";
    } catch (Exception e) {
        System.out.println("Unexpected error: " + e.getMessage());
        return "ERROR: Something went wrong. Please try again.";
    }
}
```

### UI — Never Show Raw Exceptions to User
```java
// BAD — never do this
catch (Exception e) {
    JOptionPane.showMessageDialog(this, e.getMessage()); // confusing to user
}

// GOOD — show friendly message
catch (Exception e) {
    statusLabel.setText("Something went wrong. Please try again.");
    System.out.println(e.getMessage()); // log it for developer
}
```

---

## 14. The 10 Questions Checklist

> Answer these before writing ANY feature. Your code writes itself after.

```
1. What fields does the user fill in?

2. Which fields are MANDATORY?
   → These get empty checks

3. Any FORMAT rules?
   → date = YYYY-MM-DD, phone = 10 digits, email has @
   → These get format checks

4. Any DUPLICATE checks?
   → phone already exists? username taken?
   → These get COUNT(*) queries

5. Any EXISTENCE checks?
   → Does this patient exist? Does this doctor exist?
   → These get COUNT(*) or SELECT queries

6. Any BUSINESS RULES?
   → Date not in past, doctor available, slot free, stock enough
   → These get custom DAO methods

7. What TABLES are written to?
   → One table = no transaction
   → Multiple tables = transaction

8. What is the SUCCESS message?
   → "Patient registered with code PAT-0042"

9. What are the FAILURE messages?
   → One specific message per type of failure

10. What happens in the UI after success?
    → Clear form? Refresh table? Switch panel?
```

---

## 15. Practice Exercises

> Practice these exact scenarios to build muscle memory.

### Beginner
- Register a new user with username/password validation and duplicate check
- Add a book with title, author, and quantity validation
- Search books by title or author and display in JTable

### Intermediate
- Book a library slot — check if book is available, reduce quantity on borrow
- Return a book — check if already returned, increase quantity on return
- Update a member's contact info with duplicate phone check

### Advanced
- Issue salary — transaction: insert payroll + update staff last_paid_date
- Dispense prescription — transaction: insert dispensing + reduce stock for each medicine
- Generate bill — transaction: insert bill + insert bill items from multiple sources

### Challenge
- Full login system with sessions, role-based nav, and logout
- Complete appointment flow: book → complete → create medical record → generate bill
- Stock alert system: check all medicines below threshold and show warning on dashboard

---

> **Remember:** Every time you're stuck, write the logic in plain English first.
> If you can say it out loud, you can code it.
> Programming is just translating real human processes into instructions a computer follows.

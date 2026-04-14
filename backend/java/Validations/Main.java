public class Main {
    public boolean registerUser(String name, String email, String password, int age) {
        if (name.isBlank() || name.length() < 2 || name.length() > 50) {
            throw new RuntimeException("name should not be empty or less than 2 and more than 50 characters");
        }
        if (!email.trim().contains("@") || !email.trim().contains(".")) {
            throw new RuntimeException("email must contain @ and .");
        }
        if (!password.matches("^(?=.*[A-Z])(?=.*\\\\d).{8,}$\"")) {
            throw new RuntimeException("invalid password");
        }
        if (age > 120 || age < 18) {
            throw new RuntimeException("Invalid age");
        }
        return true;
    }

    public static void main(String args[]) {

    }

}

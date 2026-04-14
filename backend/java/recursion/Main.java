public class Main {
    public static int factorial(int n) {
        if (n == 0)
            return 1;
        return n * factorial(n - 1);
    }
    public static int sumOfDigits(int n){
        if (n == 0) return 0;
        return (n%10) + sumOfDigits(n/10);
    }
    public static String reverseString(String str){
        if(str.length() <=1)return str;
        return reverseString(str.substring(1))+ str.charAt(0);
    }
    public static void main(String[] args) {
        System.out.println(factorial(5));
        System.out.println(sumOfDigits(12345));
        System.out.println(reverseString("Suryabhanu Araj Manmohan Bhagtuuu"));

    }
}

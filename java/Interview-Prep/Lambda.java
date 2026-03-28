import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Lambda {
    public static void main(String[] args) {
        // old way - anonymous class
        Runnable r = new Runnable() {
            public void run() {
                System.out.println("Hello");
            }
        };
        r.run();

        // lambda
        Runnable r1 = () -> {
            System.out.println("Hello");
        };
        r1.run();

        List<String> words = Arrays.asList("banana", "fig", "apple", "kiwi");
        words.sort((a, b) -> a.length() - b.length());
        System.out.println(words);
        List<Integer> nums = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8));
        nums.removeIf(n -> n % 2 != 0);
        System.out.println(nums);
    }

}

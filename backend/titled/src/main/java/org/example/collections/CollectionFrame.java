package org.example.collections;

import java.lang.reflect.Array;
import java.util.*;


class Person {
    String name;
}

public class CollectionFrame {
    public static int[] twoSum(int[] numbers, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < numbers.length; i++) {
            int cmp = target - numbers[i];
            System.out.println(map);
            if (map.containsKey(cmp)) {
                return new int[]{map.get(cmp), i};
            }
            map.put(numbers[i], i);
        }
        throw new IllegalArgumentException("No solution found");
    }
    public static void main(String args[]) {
        System.out.println("Running...");
        System.out.println(Arrays.toString(twoSum(new int[]{1, 2, 3, 4, 5, 6, 7}, 7)));
        System.out.println(Array.getBoolean(new boolean[]{true, false, true, true, true, false}, 2));
        Person p1 = new Person();
        Person p2 = new Person();

        System.out.println(p1.hashCode());
        System.out.println(p2.hashCode());
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println("Running");
        // difference bw == & .equals()
        String a = new String("Hello");
        String b = new String("Hello");
        System.out.println(a == b); // == compares references
        System.out.println(a.equals(b)); // .equals() compares content/value
        // Q2. What are the 4 pillars of OOP? Give real examples.
        // Encapsulation - hiding internal state via private fields. Abstraction -
        // exposing only what's necessory(interfaces,abstract classes). Inheritance -
        // child class inherits parent's behaviour. Polymorphism - same methods
        // different behaviour(overriding/overloading)

        // . What is the difference between HashMap, LinkedHashMap, and TreeMap?
        // HashMap — no order, O(1) get/put, allows one null key.
        // LinkedHashMap — insertion order maintained, slightly slower.
        // TreeMap — sorted by key (natural/comparator), O(log n).

        /*
         * What is Dependency Injection? Types in Spring?
         * DI means spring creates nd injects dependencies instead of us creating and
         * handling them manually
         * 1. Contstructor injection(immutable, testable, loose coupled)
         * 2. Setter injection
         * 3. Field injection (hard to test)
         */
        /*
         * What is the difference
         * between @Component, @Service, @Repository, @Controller?
         * All are specializations of @Component (Spring will detect them all via
         * component scan). The difference is semantic + extra behavior:
         * 
         * @Component — generic Spring bean.
         * 
         * @Service — business logic layer (no extra behavior, just clarity).
         * 
         * @Repository — DAO layer. Adds exception translation (converts DB exceptions
         * to Spring's DataAccessException).
         * 
         * @Controller — web layer, handles HTTP requests.
         */
        /*
         * Q16. How does Spring Boot auto-configuration work?
         * Spring Boot reads
         * META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.
         * imports and conditionally configures beans using @Conditional annotations.
         * Example: If H2 is on classpath, Spring Boot auto-configures an in-memory
         * DataSource.
         * Key
         * conditional annotations: @ConditionalOnClass, @ConditionalOnMissingBean, @ConditionalOnProperty.
         */

    }
}

const users = [
  { name: "Lodu", address: "Mumbai", course: "CS" },
  { name: "Lodu 1", address: "Lucknow", course: "Machanical" },
  { name: "Lodu 2", address: "Delhi", course: "Civil" },
  { name: "Lodu 3", address: "Dehradoon", course: "CS" },
];

console.log(users.filter((user) => user.course === "CS"));

const number = [1, 2, 34, 5, 6, 7, 77];
function getPair(number){
    
    let temp = number[0];
    let maxIndex = 0;
    for (let i = 0; i < number.length; i++) {
        if (number[i] > temp) {
            temp = number[i];
            maxIndex = i;
        }
    }
    return {maxIndex, temp};
}
console.log(getPair(number));

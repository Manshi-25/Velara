import {
uniqueNamesGenerator,
adjectives,
animals
}
from "unique-names-generator"

export function generateAnonymousName(){

return uniqueNamesGenerator({

dictionaries:[
adjectives,
animals
],

separator:"",
length:2

})

}
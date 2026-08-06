const joi = require('joi');

const validation = joi.object({
    fullName: joi.string()
            .min(3)
            .required(),
    userName: joi.string()
            .min(3)
            .required(),

    email: joi.string()
            .email(),

    password: joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+={}|;:",.<>?`~\\-]{8,}$')),  // Password must be at least 8 characters long and can include special characters

    confirmPassword: joi.string()
        .valid(joi.ref('password'))  // Ensure confirmPassword matches password
        .required(),

     phoneNumber: joi.string()
        .pattern(new RegExp('^[0-9]+$')) // Allows any length of numbers
        .required(),

});

module.exports = validation
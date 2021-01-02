"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
const validateRegister = (options) => {
    if (!options.email.includes('@')) {
        return [
            {
                field: "email",
                message: "Invalid email"
            }
        ];
    }
    if (options.username.length <= 2) {
        return [
            {
                field: "username",
                message: "Must be atleast 3 characters long."
            }
        ];
    }
    if (options.username.includes('@')) {
        return [
            {
                field: "username",
                message: "Can not use @ for username"
            }
        ];
    }
    if (options.password.length <= 2) {
        return [
            {
                field: "password",
                message: "Password must be atleast 3 characters long."
            }
        ];
    }
    return null;
};
exports.validateRegister = validateRegister;
//# sourceMappingURL=validateRegister.js.map
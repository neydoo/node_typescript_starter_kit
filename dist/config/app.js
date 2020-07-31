"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    app: {
        port: process.env.PORT,
        name: "Test",
        email: "adedotunolawale@gmail.com",
        JWT_SECRET: process.env.JWT_SECRET,
    },
    user: process.env.user,
    db: {
        url: process.env.MONGODB_URI,
    },
    image: {
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        cloud_name: process.env.CLOUD_NAME,
    },
    data: {
        limit: "50mb",
        extended: false,
    },
    mail: {
        auth: {
            api_user: process.env.SENDGRID_USERNAME,
            api_key: process.env.SENDGRID_PASSWORD,
        },
        sendgrid: {
            api_key: process.env.SENDGRID_API_KEY,
        },
    },
    sms: {
        africastalking: {
            apiKey: "f39adb22724c3c6686c19dce339dcb3e5344bb412512b294193c27139f5a0b93",
            username: "weserve",
        },
        twilio: {
            apiKey: "",
            username: "",
        },
        termii: {
            apiKey: process.env.TERMII_SMS_KEY,
            url: process.env.TERMII_SMS_URL,
        },
    },
    video: {
        vimeo: {
            clientId: "b4c2351fdc0293b73e0edbf5db27685aa52af6d9",
            clientSecret: "jwSfO3NBVqNY+VNbA9D8u+biO460z0pVl8DmlT/e8matjD+UeyVLHNzsAXObVfCav1uFds8rPR3rvu+DXRL0kWRwEk8R09phcQ64qThLMLLMrXzHoH/Q774f2McIQn2f",
            accessToken: "a852ca944c59ab717ee9a94ed3c6b50a",
        },
    },
    pusher: {
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_APP_KEY,
        secret: process.env.PUSHER_APP_SECRET,
        cluster: process.env.PUSHER_APP_CLUSTER,
    },
    recycle: {
        logoUrl: "https://res.cloudinary.com/dktpvgymr/image/upload/v1596172596/Screen_Shot_2020-07-31_at_6.15.45_AM_hvfnq1.png"
    }
};

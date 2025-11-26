graph LR
    root[server/]
    style root fill:#f96,stroke:#333,stroke-width:4px

    %% Top Level Files
    root --> pkg[package.json / lock]
    root --> env[.env]
    root --> git[.gitignore]
    root --> testData[story-api-test-data.json]

    %% SRC Folder
    root --> src[src/]
    style src fill:#61dafb,stroke:#333,stroke-width:2px

    %% Entry Points
    src --> entry1[app.js]
    src --> entry2[server.js]

    %% Folders inside SRC
    src --> Controllers[controllers/]
    src --> Routes[routes/]
    src --> Models[models/]
    src --> DB[db/]
    src --> Middlewares[middlewares/]
    src --> Utils[utils/]

    %% Detail: Controllers
    Controllers --> C1(comment.controller.js)
    Controllers --> C2(followers.controller.js)
    Controllers --> C3(like.controller.js)
    Controllers --> C4(post.controller.js)
    Controllers --> C5(story.controller.js)
    Controllers --> C6(user.controller.js)

    %% Detail: Routes
    Routes --> R1(comment.routes.js)
    Routes --> R2(followers.routes.js)
    Routes --> R3(like.routes.js)
    Routes --> R4(post.routes.js)
    Routes --> R5(story.routes.js)
    Routes --> R6(user.routes.js)
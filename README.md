# PJC Race Tracker - by up2203185
## Key features
In my web application, key features are encouraged wherever I could place them. Examples of these are: 

- Race Display Page
- Administrator Race Dashboard
- Offline Local Storage
- New Race
- User Roles/"Auth"

The authentication isn't authentication, but rather a dropdown in the main index page allowing you to change your viewing experience. Completing key features encumbered a lot of development as there were a lot of idiosyncrasies that I didn't expect to be there until I encountered them.

### User Type
For this application, I had to figure out a way for users to differentiate between someone that is purely a spectator, a marshal, and an administrator. This is accomplished thanks to a single object literal stored in `/util/userType.js`. 

This allows me to handle the state of the user persistently across pages, if it needed updating - or retrieving. I opted to not use a class as it didn't require instantiation, as it only needed to follow the singleton pattern.

Lastly, it is purely helpers, and uses stateless functions. However, this is only achieved because I used localStorage for the roles.

To modify your userType - the main page at the root `/` contains a dropdown select box in the top left of your navbar.

### Pagination
This application utilises pagination for display of large lists, such as for users and the race list. Each page has a max count of 10, and will automatically enable/disable the next/previous buttons according to the current page. When data is fetched, the tables are redrawn, but your current page is maintained - meaning you don't restart from page 1 again. 

### Home Page
This application's index page will list every race made, and will allow any user to click to view the race results page. It also contains a button to empty your local storage. 

### Race Display page
Each race can be visited by clicking on a row in the root home page table - or directly visiting the race id url (e.g. `/race/{raceid}`) of which raceid is an incremental number automatically assigned to each race.

In the display of this table, a database query is ran to retrieve all the data related to this race. It is then formatted into JSON, passed back to the frontend, and displayed in the table.

The table, by default, Name, Bib Number, and Finish. This is because all races have these features no matter what. Support for checkpoints is in the database, however there is no visual way to view them as of current (this was omitted early in my coursework as I needed to focus on other tasks).

To refresh data for this table, I intended to use either a button to manually refresh statistics, or automatically retrieve them every 10 seconds using `setInterval();`. I ended both options, as it allowed the page to stay live - but also allow the user to request it manually. When updating the table, it clears and rewrites. If you were reading the table, and it updated - you would be sent back to the top of the table; annoying right? To solve this, I added in a variable to capture the scrolling position during the table. This would then allow me to restore the scroll position in the table after a fetch request.

The page race details section at the top of the screen, contains details regarding the time the race started, the location of the race, how many checkpoints there are, and the total number of participants. This also includes the race, and a race indicator if the race is live. If the race is finished, it will have the final time of the race.

The same section also includes a refresh button, and a dashboard button (if userType is marshal or administrator). 

On the top right of the page, there is a register interest form, allowing any user to enter their first and last name, and request to join the race. This can be accepted, or rejected, from the dashboard when viewed as an administrator. When a race is live, this registration form is deleted from the page, resizing the race details to cover the top.

### Race Creation
When authenticated as an administrator, it will show New Race permanently in your nav bar. This allows for a global place to enact a new race.

When I designed the flow for creating a race originally, I intended for it to be divvied up into sections on the page for each major part of the race setup. This felt too clunky for what I wanted, and didn't at all achieve my desired intention. I therefore did some research and chose to go with a multi-page form. I wanted to use the form tag for this, however I ultimately didn't. I used a custom formData object to store the inputs as the user navigated the flow, ensuring validation was handled, and that progress was updated as you stepped. 

Whilst developing the form, I made sure to also read the w3 standard for when forms are multiple pages located [here](https://www.w3.org/WAI/tutorials/forms/multi-page/). This outlined that I: (a) repeat overall instructions on every page; (b) split the form up according to logical groups; and (c) make it easy to recognise and skip optional stages.

The form only requires you to insert the race details at the start, and will only require you to input data in optional places if you click insert on those pages. 

### Admin Dashboard
The administrator dashboard can be visited from the race details page. If your usertype is marshal, or administrator, it will show a button for this. The dashboard page is a list of sections allowing for proper organisation and administration of the race. It provides interaction with a race timer, timestamp recording, handling timestamp conflicts, accepting/rejecting interested users, and deleting the race.

#### Race Timer
The race timer, like the usertype, is again a single object literal is there is - at all times - only one race timer being displayed. This allows me to provide easy interactivity across races without handling multiple instances. When viewed as a marshal, they are only able to see the timer, and the state of the race (waiting, starting, live, etc). However, administrators are able to start and stop the race. 

#### Timestamp Recording
Timestamp recording seemed like one of the simpler parts of the application to complete, however it is a red herring. There were a lot of complexities that had to be taken into consideration. These being:

- User is online as normal
- Timer is live (was started before going offline)
- No race start time or timer not live

This was accomplished partly whilst including a sense of trust between marshals, and the live race. As timestamps can be recorded if the race is not live (but the user is offline) as you may have not been online to register the starting of the race. If a timestamp is recorded whilst offline it will, instead of using the elapsed race time, use the timestamp and store a JSON object with a type attribute set to "offline". Upon reconnecting back online, it will run a function to convert this timestamp appropriately to an elapsed time, ready for submission. 

The system for recording timestamps was made to reflect git. It has 3 stages: your working area, the staged area, and finally the submit button. If offline, the submit is disabled until you reconnect. Timestamps that are recorded go into the working area. You can then click select on them, and type a racer bib number in the box above, and assign it to a runner. Doing this, will move that timestamp to the staging area where, when online, you can submit all staged timestamps to the server. It is intentional to able to record multiple timestamps for the same user.

#### Timestamp Conflicts
The timestamp conflict section is another feature of the fashboard that allows for race administrators to decide which timestamps to use when there are multiple timestamps for a person. When the server recieves a timestamp, the first one it receives for a user is set to their finish time, and any subsequent timestamp is seen as "pending". These pending requests are displayed here.

Online race administrators are able to view all conflicting timestamps for a race user, and which marshal submitted them. They can then be rejected, and accepted. Each conflict is displayed in its own card, dispaying in large the new time, in yellow the current time, and beneath in smaller text - the time when that conflict was submitted and who by.

Accepting a conflict removes all other timestamps related to that user. Rejecting a conflict only removes that specific conflict.

#### User Interest Registration
Users may request registration from the previously mentioned race details page. In the admin dashboard, administrators may accept or reject these users from joining the race.

#### Race Danger Zone
This zone is an administrator only area that allows the admin to delete the race.

### CSV Exports
CSV exports can be made by the race administrators from the race details page. This will download a file of al participants (excluding pagination limitation).

## AI
My use of AI in this project was to instigate further personal development and research topics/ideas to further improve my code and approach. By and large, the whole experience was good, and provided me with a good range of new ideas and options to take with my code. 

### Prompts to develop race details table
>  How can I turn a table row in a tbody into a details tag?

I asked this because `<details>` elements can't be direct children of `<tbody>` elements to preserve structure. The response recommended wrapping the `<details>` element inside of a `<td>` element. This helped create the inner details sections, however it meant I had to nest tables to properly display it.

*The above was removed after further revisions due to the impracticatality of the feature.*

> How does pagination work?

I asked this to help discover a way to introduce pagination. I already had an idea of how to implement this, however I came into roadblocks regarding the structure of how to do it without it being clustered and unreadable. It introduced me to the idea of offset regarding database queries, and passing a JSON object to track pagination between the front and backend.

> How can I provide a way for users to download files from the server?

The immediate response I got was to use Blob. However I had to research upon what a blob was - as this was the first time. After some research, I learned that a Blob is a data structure that represents immutable raw data. 

During my research, I also discovered an alternative approach using URI encoding—specifically, creating a data: URI. This method embeds the entire file content directly into the href attribute of a link by encoding it into a URL-safe format. I opted to use this over Blob as the CSV files would not be larger than 2mb, and only be small, easy exports.

### Prompts to multi-page form
For the multi-page form, I used AI to help with uncluttering some of my code.

> For the saving functions, could I use a wrapper? They all seem really identical in functionality, and seems like repetition

I asked this, as the code I had written before had been three functions with the same functionality, but with wording differences, and class/id differing names. I had used python wrapper functions in the past, but was unaware/unsure on the approach for them within JS and how to do it cleanly and with a good approach.

### Prompts used to assist with the admin dashboard
For the dashboard, I used AI to help query the potential logic behind how races handle different conditions upon which a marshal/race administrator may find themselves in.

> How can i handle race starts if a marshall is offline and doesn't get to see the race start

This allowed me to start engineering a solution to the base different scenarios that may occur with regards to the conditional logic for the race timer, and timestamp recording. 

> With regards to mainainability, what should I be looking for in the code?

This, as much of an obvious one as it may seem, allowed me to look for any potential parts of my code that I may have missed in terms of simplification or modularity, alongside - and especially - my code documentation. I researched further into documentation and used https://jsdoc.app/ as reference for my function decorations. This improvement from research can be seen above functions and within them.

## Personal Development
My personal development throughout the lifetime of this coursework has enabled me to discover areas and approaches to my code that I wouldn't have thought to do prior. Examples of this are the style of approach to decorating functions in accordance to @Use JSDoc. 

It has enabled me to think in a more modular manner, allowing for my code to be reused in other aspects of the project. An example of this is in the new race form flow, where I iterated over my old code to create a wrapper-based approach - reducing redundancy.

Tinkering with offline, and online events was a lot more difficult that it appeared to be on the surface, including with getting them to fire (firefox didn't like them). 

Returning back to the aforementioned new race form, research into these types of multi-page forms showed me the recommendations from W3C, of which I took into account to design it. These guidelines were applied during the iteration I made over my old code, ensuring a better user experience.

Through many difficulties, I have had it more emphasises that planning is essential to projects that are bigger than a couple of lines. Architectural decisions you make early on can highly impact what routes you take later down the line.  
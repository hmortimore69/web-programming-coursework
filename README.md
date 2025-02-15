# Race Time - by up2203185
## Key features
Replace this text with an introduction to your key features.


### Race URL Display Table
In the race history table located at the root, visit a race by clicking on a row in the table.
You can also visit a race by visiting `/race/{raceid}` - of which raceid is an incremental number assigned to each race.
In the display of this table, a database query is ran to retrieve all the data related to this race. It is then formatted into JSON, passed back to the frontend, and displayed in the table.

The table, by default, Name, Bib Number, and Finish. This is because all races have these features no matter what.
If, and only if, the race has checkpoints then the database query picks up on this and the front-end JS will generate as many columns as needed to display this. The values for attended are stored as booleans, so displaying them I used the ternary operator to display Y/N correspondingly.

Furthermore, when displaying checkpoint time, I had originally used timestamps, converting them using Date(). This, whilst it worked, felt illogical - and less readable.
To improve this, I used a function that took each checkpoint, and calculated the time differential from the previous checkpoint (or start), and the total elapsed time from the race start. This is then displayed as: "+XX:XX (XX:XX)". The brackets contain the total elapsed time, and the time after the + is the differential.

To also help readability, I added mouse hovering for the table. Hovering over a row will change the background colour to a <span style="color:#ffaeae">a pale red</span>.

To refresh data for this table, I intended to use either a button to manually refresh statistics, or automatically retrieve them every 10 seconds using `setInterval();`. I ended up using the former option over the latter, as it allowed the user to choose when to update, and wouldn't flood the server with database queries. When updating the table, it clears and rewrites. If you were reading the table, and it updated - you would be sent back to the top of the table; annoying right? To solve this, I added in a variable to capture the scrolling position during the table. This would then allow me to restore the scroll position in the table after a fetch request.

### Key Another Feature Name/Description.
Tell us briefly how to find & use it.
Describe the thinking behind the design of this feature features.  

.
.
.
### Final Key Feature Name/Description.
Same for each feature… you get the idea :-)


## AI
Replace this with DETAIL about your use of AI, listing of the prompts you used, and whether the results formed or inspired part of your final submission and where we can see this (and if not, why not?). You may wish to group prompts into headings/sections - use markdown in any way that it helps you communicate your use of AI.  Tell us about what went right,  what went horribly wrong and what you learned from it.

### Prompts to develop race details table
A sequence of prompts helped me develop this feature:

>  How can I turn a table row in a tbody into a details tag?
I asked this because `<details>` elements can't be direct children of `<tbody>` elements to preserve structure. The response recommended wrapping the `<details>` element inside of a `<td>` element. This helped create the inner details sections, however it meant I had to nest tables to properly display it.

### Prompts to develop GHIJ (example)
For the GHIJ feature I ...

>  this is an example prompt given to a chatbot
words words words etc

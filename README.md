# Daily-Choice-Attendace
A Google Apps Script project to move student attendance data between Google Sheets.

## Intended Usecase
This program was developed for school use to aid in keeping track of which students are to be with which teacher during mixed year activites. It takes a Google Sheets file of all the class lists and then keeps another spreadsheet up to date with students sorted into tabs telling them which teacher they should be with.

While this script is intended for school use to sort students across classes into groups for attendance you can theoretically use it for anything you may want to be organized into a similar spreadsheet format.

## Deployment

### Spreadsheet Setup

Set up a Google Sheets file with the following format. A Header on the first two rows, a side banner in the first column, the student's class in the second column, the students last name in the third, first name in the fourth, and finally a dropdown with the chosen teachers in the fifth. Each student get's his/her own row. Each class of students should have their own tab on the spread sheet named after their class. (This format is kinda flexable and can theroetically use any data, the important thing to remember is that the dropdown decides the destination tab on the second file for the other three columns)

Here is what that may look like.

![Sample class list sheet](/markdownAssets/ClassSpreadsheetEX.png)

Now set up another Google Sheets file with the top row as a header, recreate this header on as many tabs as you have choices for your dropdown and name them after your choices verbatim. **If there is a typo things will break.** 

Here is an example of what the sheet may look like once the script populates it with data.

![Sample Attendance list sheet](/markdownAssets/TeacherSpreadsheetEX.png)

### Code setup
***Any typos and mistakes here will cause the program to not work correctly or at all***

Take the code.gs file and add it to a new Google Apps Script project. (Copy pasting into the default code.gs works) Find the line containing `const CLASS_LIST_SHEET_ID = PLACEHOLDER;` and change the `PLACEHOLDER` to the sheet ID of the first Google Sheets file you made. The ID is found in the URI of the webpage for editing the file. The URI looks something like this: https://docs.google.com/spreadsheets/d/ **YOUR ID HERE** /edit?gid=0#gid=0 

Next, right under your newly added ID you should see:

    const LIST_OF_CLASS_TABS = [
        'Class 1',
        'Class 2',
        'and so on'
    ];
Change the place holder class names such as `'Class 1'` to the names of your class tabs in the first spreadsheet file. **Make sure to maintain the order**

Then, find `const TEACHER_ATTENDANCE_SHEET_ID = PLACEHOLDER2;` and change `PLACEHOLDER2` with the ID of the second spreadsheet file you made, in a similar fashion to the first one. 

Now, like the first file, right under the ID you will find:

    const LIST_OF_TEACHER_TABS = [
        'Teacher 1',
        'Teacher 2',
        'and so on'
    ];
Like before change these list items with the names of your tabs on the second file keeping the order.

Create a new trigger and tell it to execute the `run()` function on a time trigger. You can set it to repeat (updating the spreadsheets) as often as you like. Then create a new deployment and set it to web app with acess set to a Google account with edit access to the spreadsheets in use.

***Enjoy!***

## Notes

### Time of Day Behaviour
By default this program only updates the spreadsheet during the school day and keeps it clear when school is closed. It will also set all the choices to "Not Selected" in the first Google Sheets file when school is closed. To disable this functionality, go to the `run()` function in the code and remove the `if` statement and the `else` statement containing the function `resetChoices()` so that the only contents of the `run()` function that remain are `clearTeacherTabs()` and `distriobuteChoices()` in that order.

If changing these paramteres is desired, find the `afterHours(currentDate)` function and adjust the if statements to the desired behaviour, there is a code comment with a hint regarding this.

### My spreadsheet just went blank infront of me HELP!
This is normal, this simply means that the sheet is updating, wait a few seconds and it should be back.

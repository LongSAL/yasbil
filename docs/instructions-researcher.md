# YASBIL-WP Instructions for Researchers

Assuming the following:

1. A [WordPress Website](https://wordpress.org/download/) with an **https URL** is available to you, where you have permission to install plugins. Please do not use YASBIL without an HTTPS connection.

2. The underlying MySQL / Mariadb variable [`max_allowed_packet`](https://mariadb.com/kb/en/server-system-variables/#max_allowed_packet) is set to a sufficiently large value (e.g. 256M) to handle large size data sync from participants’ local machines.

3. The latest version of YASBIL-WP WordPress Plugin (yasbil-wp.zip) is downloaded from the YASBIL Github Page and is installed in your WordPress website (Unsure? Please read: [how to install WordPress plugin by Manual Upload via WordPress Admin](https://wordpress.org/support/article/managing-plugins/#manual-upload-via-wordpress-admin))

4. You are logged in to the WordPress admin dashboard, whose URL is 
**`https://www.your-website.com/wp-admin`**

----
## Step 1: Create YASBIL Project
1. On the left menubar, navigate to **YASBIL-WP > YASBIL Projects**.

2. In the **Name** field, enter a short name for your research project (e.g. IIR Study 1). Leave the slug field blank (WordPress will auto-fill it with a URL friendly string). Optionally, you can enter a note about this project in the **description** field.

3. Click **Add New YASBIL Project** button.

4. The newly added project will be shown to the right. Now you are ready to add participants to this project.



----
## Step 2: Add Participant to Project

0. Before adding participants, make sure you have a YASBIL Project set up.

1. On the left menubar, navigate to **Users > Add New**.

2. In the **Username** field, enter the codename for your participant (e.g. P001_TZK).
  _Recommended: attach a random string to the end of the codename (\_TZK  in the example) so that your next participant, e.g., P002, cannot guess the complete username of P001._

3. In the **Email** field, you can either enter the participant’s actual email or a dummy email. The purpose of the email would be to send password reset emails to the participant. However, please see the note about passwords below.

4. The **Role** should be **subscriber**.

5. Select the **YASBIL Project** for this participant using the radio buttons. If you have multiple available projects, you can assign the current participant to any **one** project.

6. Click **Add New User**. The page will refresh and get redirect to the Users page.

7. Click the **username of the participant** you created. You will get navigated to the Edit User page.

8. Scroll down to see **Application Password**.

9. In the **New Application Password Name**, enter a descriptive name (e.g.,  such as “yasbil browser extension”).

10. Click **Add New Application Password**.

11. **Copy the 16 character application password shown** (e.g., `q9D7 wS93 oTAq rJgG UiyB Tq0u`) and save it in a safe location. _This password will never be shown again._

12. Share the following information with your participant, which they will enter in the browser extension.

  * Server URL: URL to your WordPress installation (e.g., https://www.your-website.com)
  * Username: participant codename you entered in step 2.
  * App Password: the 16 character application password from Step 10


13. Your participant should now be able to sync data to your WordPress website’s database.

 
### A note about Participant’s Passwords:
In effect, two passwords are being associated with each participant’s user account:

- the **normal WordPress login password**, which is used for interactively logging in to the WordPress admin dashboard, if participant wishes to view the uploaded data, and,
- an **application password**, that is used by the browser extension to sync the data to the server. This application password cannot be used to interactively log in to the WordPress admin section.

The application password need not be remembered by the participant. It is to be saved in the settings page of the browser extension in a “set once and forget it” fashion. If the application password is compromised, you can revoke it from the Edit User screen, and generate a new application password to share with your participant.

----
## Step 3: View Collected Data

1. On the left menubar, click **YASBIL-WP**.

2. You will reach the **Overall Summary page**, where you can see a list of all your projects, and enrolled participants within each project.

3. Click on a **participant’s name** to go to the participant details page, and see the Page Visits data in reverse chronological order. _More data visualization screens will be added soon._

 
4. Back in the overall summary page, you can **enable** or **disable** participants using the checkboxes and the appropriate buttons

**Disabling** a participant’s account means they will no longer be able to upload browsing data to your server. You will want to do this, for instance, when data collection for a project is over. You can enable and disable the same participant multiple times.

- When a new user account for a participant is added, the account is enabled by default.

- A participant account can also be disabled, in effect, by revoking the application password for that participant.

## Participant Management
Participant will be able to sync data to the server only if they are active 
(i.e. `yasbil_user_status` user meta field is not equal to the string `DISABLED`). 
This can be modified from the WordPress YASBIL-WP plugin interface.
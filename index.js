console.log("Test");
import express from "express";
import axios from "axios";

// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const port = 3000;

const token_key =
  "patDCl9AV9GritRaJ.511866f929bde285aefe7f85b6ceb2009767f7f545e64eeb22e956c2ea960cd1";
const baseId = "appudFLCVhkDxcwsj";
const volunteer_table_id = "tbl82O3e0cUbzMOxp";
const airtableEndpoint = `https://api.airtable.com/v0/${baseId}/${volunteer_table_id}`;

var volunteerVerified = "undefined";

app.post("/verify-email", async (req, res) => {
  const email_to_validate = req.body.validationEmail;
  console.log("***Post request***");
  console.log("Email entered:", email_to_validate);

  try {
    const response = await axios.get(airtableEndpoint, {
      headers: {
        Authorization: `Bearer ${token_key}`,
      },
      params: {
        filterByFormula: `{Email} = "${email_to_validate}"`,
      },
    });

    const records = response.data.records;

    console.log("Records retrieved:", records.length);
    console.log(records.length === 0);
    console.log(records);

    if (records.length === 0) {
      volunteerVerified = "false";
      console.log("Length 0 Case");
      res.render("index.ejs", {
        pageContent: "volunteer",
        volunteerVerified: volunteerVerified,
        verifyNoti:
          "Verification failed! Please try again or register below if you are a new volunteer.",
      });
    } else {
      volunteerVerified = "true";
      res.render("index.ejs", {
        pageContent: "volunteer",
        volunteerVerified: volunteerVerified,
        fName: records[0].fields["First Name"],
        lName: records[0].fields["Last Name"],
        userEmail: records[0].fields["Email"],
        phoneNum: records[0].fields["Phone number"],
        volHour: records[0].fields["Total hours volunteered"],
        volunteerId: records[0].id,
        verifyNoti: "Email has been verified!",
      });
    }
  } catch (error) {
    console.error("System Error:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});


app.get("/", (req, res) => {
  res.render("index.ejs", { pageContent: "home" });
});

app.get("/faqs", (req, res) => {
  res.render("index.ejs", { pageContent: "faqs" });
});

app.get("/volunteer", (req, res) => {
  res.render("index.ejs", {
    pageContent: "volunteer",
    volunteerVerified: "undefined",
  });
});

app.post("/log-volunteer-time", async(req, res) => {
  console.log(req.body);
  try {
    const response = await axios.patch(
      airtableEndpoint,
      {
        records: [
          {
            "id": req.body.volunteerId,
            "fields": {
              "Total hours volunteered": parseInt(req.body.hourInput, 10)+parseInt(req.body.volHour, 10),
            }
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${token_key}`,
          "Content-Type": "application/json",
        },
      },
    )
    console.log("Record Updated***");
    res.render("index.ejs",
    {
      pageContent: "volunteer",
      volunteerVerified: "true",
      verifyNoti: "Volunter hours successfully updated"
    })
  } catch (error) {
    console.log(error.message);
  }
})

app.post("/register-volunteer", async (req, res) => {
  console.log("***Register Post Request***");

  const email_register = req.body.regemail;
  console.log(email_register);
  const fname_register = req.body.regfName;
  const lname_register = req.body.reglName;
  const phone_register = req.body.regphone;
  console.log(req.body);
  try {
    const response = await axios.get(airtableEndpoint, {
      headers: {
        Authorization: `Bearer ${token_key}`,
      },
      params: {
        filterByFormula: `{Email} = "${email_register}"`,
      },
    });

    const records = response.data.records;
    console.log("Records Length:", records.length);
    console.log(records);
    /**
     * In case the email used to register already exists in the DB
     */
    if (records.length > 0) {
      const registerNoti =
        "Email has already been registered! Please verify your email above to log your volunteer hours.";
      res.render("index.ejs", {
        pageContent: "volunteer",
        volunteerVerified: "false",
        registerNotiFail: registerNoti,
      });
      console.log("Email exists");
    } else {
      /**
       * Make request to create a new record in DB for the new volunteer register
       */
      try {
        console.log("Email not exists. Request Register*****");
        const response = await axios.post(
          airtableEndpoint,
          {
            records: [
              {
                fields: {
                  "Email": email_register,
                  "First Name": fname_register,
                  "Last Name": lname_register,
                  "Phone number": phone_register,
                  "Total hours volunteered": 0,
                },
              },
            ],
          },
          {
            headers: {
              "Authorization": `Bearer ${token_key}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("New Record:");
        console.log(response.data.records[0].fields);
        //Render Page with message
        res.render("index.ejs", {
          pageContent: "volunteer",
          volunteerVerified: "false",
          registerNotiSuccess: "Email successfully registered!",
        });
      } catch (error) {
        console.log("New Record Error:", error.message);
        res.render("index.ejs", {
          pageContent: "volunteer",
          volunteerVerified: "false",
          registerNotiFail: error.message,
        });
      }
    }
  } catch (error) {}
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

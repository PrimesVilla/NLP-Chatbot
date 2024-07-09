const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const express = require('express');
const bodyParser = require('body-parser');
const serviceAccount = require('./bot-property-finder-firebase-adminsdk-3lvqb-2d911af754.json');



const app = express();
app.use(bodyParser.json());
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
/*const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_property_chatbot'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL connected...');
});

const properties = {
  downtown: [
    { name: "Downtown Condo", price: "$300,000", bedrooms: 2, address: "123 Main St" },
    { name: "City Center Apartment", price: "$400,000", bedrooms: 3, address: "456 Central Ave" }
  ],
  suburbs: [
    { name: "Suburban House", price: "$250,000", bedrooms: 3, address: "789 Suburb Dr" },
    { name: "Quiet Neighborhood Home", price: "$350,000", bedrooms: 4, address: "101 Suburb Ln" }
  ],
  jumeirah: [
    {name: "OCAE 401 Unfurnished", price: "310,000 AED", bedrooms: 2, address: "401 Oceana, Palm Jumeirah"},
    {name: "OCAT 603 Unfurnished", price: "180,000 AED", bedrooms: 1, address: "603 Oceana Palm Jumeirah"},
    {name: "OCAT 603 ", price: "350,000 AED", bedrooms: 2, address: "401 Oceana Palm Jumeirah"}
  ]
};*/


app.post('/webhook', async (req, res) => {
    let responseText ="";
    const propertiesRef = db.collection('/property');
    try {
        //query for search properties by location
        if (req.body.queryResult.intent.displayName == 'searchLocation') {
            const location = req.body.queryResult.parameters.location;
            
            const snapshot = await propertiesRef.where('location', '==', location).get();

            if (snapshot.empty) {
                return res.json({ fulfillmentText: `No properties found in ${location}.` });
            }

            responseText = `Here are some properties in ${location}:`;
            snapshot.forEach(doc => {
                const property = doc.data();
                responseText += `\nA ${property.name}, priced at ${property.price}, with ${property.bedroom} bedrooms, located at ${property.location}.`;
            });

            res.json({
                fulfillmentText: responseText
            });
        }

        //query for searching properties by type
        if (req.body.queryResult.intent.displayName == 'searchType') {
            const type = req.body.queryResult.parameters.type;

            const snapshot = await propertiesRef.where('type', '==', type).get();

            if (snapshot.empty) {
                return res.json({ fulfillmentText: `No properties found in ${type}.` });
            }

            responseText = `Here are some ${type} type properties:\n`;
            snapshot.forEach(doc => {
                const property = doc.data();
                responseText += `\nA ${property.name}, priced at ${property.price}, with ${property.bedroom} bedrooms, located at ${property.location}.`;
            });

            res.json({
                fulfillmentText: responseText
            });
            
        }

        if(req.body.queryResult.intent.displayName == 'searchPrice'){
            const price = req.body.queryResult.parameters.price;
        
            const snapshot = await propertiesRef.where('price', '<=', parseInt(price)).get();

            if (snapshot.empty) {
                return res.json({ fulfillmentText: `No properties found in ${price}.` });
            }

            responseText = `Here are some properties under ${price}:\n`;
            snapshot.forEach(doc => {
                const property = doc.data();
                responseText += `\nA ${property.name}, priced at ${property.price}, with ${property.bedroom} bedrooms, located at ${property.location}.`;
            });

            res.json({
                fulfillmentText: responseText
            });
        }
    } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ error: 'Database query error' });
    }

  
  //save user-bot conversation to firebase
  try {
    await db.collection(req.body.session).add({
      user: String(req.body.queryResult.queryText),
      bot: responseText,
      intent: String(req.body.queryResult.intent.displayName)
    });
  } catch (error) {
    console.error('Error with db:', error);
    res.status(500).json({ error: `Error adding document to ${req.body.queryResult.session}` });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

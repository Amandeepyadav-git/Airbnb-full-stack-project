const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ejs = require('ejs');
const Listing = require("./models/listing.js")
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js")
const ExpressError = require("./utils/ExpressError.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.urlencoded({extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")))

const MONGO_URL = "mongodb://127.0.0.1:27017/wonderlust";

main()
.then(()=>{console.log("Connected to DB");})
.catch((err) => {console.log(err);})

async function main () {
    await mongoose.connect(MONGO_URL);
}


app.get("/", (req, res)=>{ res.send("Hi I am root"); });

app.get("/listing", async (req, res)=>{
  const allListings =  await Listing.find({});
  // console.log(allListings);
  res.render("listings/index.ejs", {allListings});
})


//create -route
app.get("/listing/new", (req, res)=>{
  res.render("listings/new.ejs");
})


app.post("/listings",wrapAsync(async (req, res, next)=>{
  if(!req.body.listing){
    throw new ExpressError(400, "Send valid data for listing")
  }
   const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listing");

}))

app.get("/listing/:id",wrapAsync( async (req, res)=>{
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("show.ejs", { listing })
}))

//edit route
app.get("/listing/:id/edit",wrapAsync( async(req, res)=>{
  let {id} = req.params;
 let listing = await Listing.findById(id);
  res.render("listings/edit.ejs", {listing})
}))

//put request after editing
app.put("/listing/:id",wrapAsync( async (req, res)=>{
   if(!req.body.listing){
    throw new ExpressError(400, "Send valid data for listing")
  }
  let {id} = req.params;
  await Listing.findByIdAndUpdate(id, {...req.body.listing});
  res.redirect("/listing");
}))

//delete request
app.delete("/listing/:id", wrapAsync( async (req, res)=>{
  let {id} = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  // console.log(deletedListing);
  res.redirect("/listing");
}))

app.all(/.*/, (req, res, next)=>{
  next(new ExpressError(404, "Page not found!"));
})

//middleware for error handling
app.use((err, req, res, next)=>{
  let {statusCode = 500, message = "Something went wrong!"} = err;
  res.render("error.ejs", {message});
  // res.status(statusCode).send(message);
})

app.listen(8080, ()=>{ console.log("Server is listening at port 8080");});
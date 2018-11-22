import express from 'express'
import bodyParser from 'body-parser'
import bcrypt from 'bcryptjs'
import Users from './models/usersModel'
import Allphotos from './models/allPhotosModel'
import LikesComments from './models/likesCommentsModel'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config();
const app = express();
app.use(bodyParser.json());
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useFindAndModify: false });

// AUTH

app.post('/api/auth', (req, res) => {
	const {credentials} = req.body;
	Users.findOne({email: credentials.email}).then(user => {
		if (user && user.isValidPassword(credentials.password, 10)) {
			res.json(
				user.toAuthJSON()
			)
		}
		else {
			res.status(400).json({errors: {global: "Incorrect email or password"}})
		}
	})
})

app.post('/api/signup', (req, res) => {
	const {credentials} = req.body;
	bcrypt.hash(credentials.password, 10).then(pas => {
		Users.create({
			photo: credentials.photo,
			firstname: credentials.firstname,
			surname: credentials.surname,
			email: credentials.email,
			passwordHash: pas
		}).then(res.status(200))
	})
})

app.post('/api/checkauth', (req, res) => {
	const {user} = req.body;
	Users.findById(user.user_id).then(data => {
		let verify = data.verifyJWT(user.token);
		if (verify.email === data.email) {
			res.json(
				data.toAuthJSON()
			)
		}
	})
})

// WORK WITH COLLECTIONS

app.post('/api/addnewcollection', (req, res) => {
	const {data} = req.body;
	console.log(data)
	Users.findOneAndUpdate({_id: data.user_id}, 
		{$push: {
			collections: {
				collection_name: data.collection_name,
				collection_photos: []
			}}}, (err, item) => {
				if (err)
					res.json('Server error')
				else
					res.status(200).send('Collection created')
			})
})

app.post('/api/addtocollection', (req, res) => {
	const {data} = req.body;
	Users.updateOne({_id: data.user_id, 'collections.collection_name': data.collection_name}, {$push: {'collections.$.collection_photos': data.photo_id}},
		(err) => {
			if(err) {
				console.log(err)
			}
	})
})

// ACTIONS WITH PHOTOS

app.post('/api/upload', (req, res) => {
	const {data} = req.body;
	Allphotos.create({
		author_photo: data.author_photo,
		author_name: data.author_name,
		author_id: data.author_id,
		photo_url: data.photo_url,
		title: data.title,
		category: data.category,
		keywords: data.keywords,
		description: data.description,
		likes: 0,
		comments: []
	}).then(item => LikesComments.create({
		photo_id: item._id
	})).then(res.send('Your photo has been uploaded'))
})

app.post('/api/likephoto', (req, res) => {
	const {data} = req.body;
	LikesComments.findOneAndUpdate({photo_id: data.photo_id}, {$inc: {likes: 1}}, (err, item) => {
		if(err) 
			console.log('Something went wrong with photo Id')
	}).then(
		Users.findOneAndUpdate({_id: data.user_id}, {$push: {liked_photos: data.photo_id}}, (err, item) => {
			if(err) 
				console.log('Something went wrong with user Id')
		})).then(res.status(200).send('Liked'));	
})

app.post('/api/addcomment', (req, res) => {
	const {data} = req.body;
	let comment = {
		user_id: data.user_id, 
		user_photo: data.user_photo,
		username: data.username,
		comment: data.comment,
		date: new Date
	}
	LikesComments.findOneAndUpdate({photo_id: data.photo_id}, {$push: {comments: comment}}, (err, item) => {
		if(err)
			console.log('Something went wrong with adding comment')
		else
			res.status(200).send('Comment added')
	})
})

// GET PHOTOS OR INFORMATION

app.post('/api/getLikesAndComments', (req, res) => {
	const {photo_id} = req.body;
	LikesComments.findOne({photo_id: photo_id}).then(data => {
		res.json(data)
	})
})

app.post ('/allphotos', (req, res) => {
	Allphotos.find({}).then(items => {
		res.json(items.reverse())
	})
});

app.post ('/api/getdate', (req, res) => {
	let date = new Date;
	res.json(date)
})

app.listen (5000, () => console.log ('Working!!'))
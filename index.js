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
	Users.findOne({email: credentials.email}).then((user) => {
		if(user) {
			res.status(400).json({errors: {global: "This email is already registered"}});
		} else {
				bcrypt.hash(credentials.password, 10).then(pas => {
				Users.create({
					photo: credentials.photo,
					firstname: credentials.firstname,
					surname: credentials.surname,
					email: credentials.email,
					passwordHash: pas
				}).then(res.status(200))
			})
		}
	})
	
})

app.post('/api/checkauth', (req, res) => {
	const {user} = req.body;
	if(user.user_id) {
		Users.findById(user.user_id).then(data => {
			let verify = data.verifyJWT(user.token);
			if (verify.email === data.email) {
				res.json(
					data.toAuthJSON()
				)
			}
		}, () => res.json({token: ''}))
	} else {
			res.json({token: ''})
	}
})

// WORK WITH COLLECTIONS

app.post('/api/addnewcollection', (req, res) => {
	const {data} = req.body;
	Users.findOneAndUpdate({_id: data.user_id}, 
		{$push: {
			collections: {
				collection_name: data.collection_name,
				last_photo_url: '',
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
	Users.updateOne({_id: data.user_id, 'collections.collection_name': data.collection_name}, 
	{$push: 
		{'collections.$.collection_photos': data.photo_id}, 
		'collections.$.last_photo_url': data.last_photo_url},
		(err) => {
			if(err) {
				console.log(err)
			};
			res.send('Collection updated')
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
	}).then(item => LikesComments.create({
		photo_id: item._id
	})).then(res.send('Success'))
})

app.post('/api/likephoto', (req, res) => {
	const {data} = req.body;
	LikesComments.findOneAndUpdate({photo_id: data.photo_id}, {$inc: {likes: 1}}, (err) => {
		if(err) 
			console.log('Something went wrong with photo Id')
	});
	Users.findOneAndUpdate({_id: data.author_id}, {$inc: {'counts.likes': 1}}, (err) => {
		if(err)
			console.log('I hate this')
	})
	Users.findOneAndUpdate({_id: data.user_id}, {$push: {liked_photos: data.photo_id}}, (err) => {
		if(err) 
			console.log('Something went wrong with user Id')
	}).then(res.status(200).send('Liked'));
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
	});
	Users.findOneAndUpdate({_id: data.user_id}, { $push: {commentedPhotos: data.photo_id}}, (err) => {
		if(err)
			console.log('Fucking promise, i hate it')
	});
})

// GET PHOTOS OR INFORMATION

app.post('/api/getLikesAndComments', (req, res) => {
	const {data} = req.body;
	let date = new Date;
	LikesComments.findOne({photo_id: data.photo_id}).then(data => {
		res.json({data: data, date: date})
	}).then(() => 
		Users.findOneAndUpdate({_id: data.author_id}, {$inc: {'counts.photo_views': 1}})	
	)
})

app.post ('/allphotos', (req, res) => {
	Allphotos.find({}).then(items => {
		itemsWithUserData(items, res)
		// let uploadersData = [];
		// let usersIds = [];
		// for (let i = 0; i < items.length; i++) {
		// 	usersIds.push(items[i].author_id)
		// }
		// Users.find({_id: usersIds}).then(uploaders => {
		// 	for (let i = 0; i < uploaders.length; i++) {
		// 		uploadersData.push({
		// 			id: uploaders[i]._id,
		// 			photo: uploaders[i].photo,
		// 			name: uploaders[i].firstname + ' ' + uploaders[i].surname
		// 		})
		// 	}
		// 	// res.json({
		// 	// 	photos: items,
		// 	// 	uploadersData: uploaders
		// 	// })
		// 	console.log(usersIds)
		// })

		// res.json(items.reverse())
	})
});

// PROFILE API

app.post ('/api/profile', (req, res) => {
	const {id} = req.body;
	Users.findOne({_id: id}).then(user => {
		res.status(200).json({
			userFirstname: user.firstname,
			userSurname: user.surname,
			profileBigPicture: user.profileBigPicture,
			userPhoto: user.photo,
			userCounts: {
				likes: user.counts.likes,
				photoViews: user.counts.photo_views
			}
		})
	})
})

app.post ('/api/get-user-photos', (req, res) => {
	const {id} = req.body;
	Allphotos.find({author_id: id}).then(photos => {
		res.status(200).json(photos)
	})
})

app.post ('/api/profile/edit', (req, res) => {
	const {data} = req.body;
	Users.findOneAndUpdate(
		{_id: data.id}, 
		{
			firstname: data.firstname,
			surname: data.surname,
			photo: data.userPhoto,
			profileBigPicture: data.profileBigPicture
		}
	)
	.then(() => Allphotos.updateMany({author_id: data.id}, {
		author_name: data.firstname + ' ' + data.surname,
		author_photo: data.userPhoto
	}))
	.then((err) => !err && res.send('Data has been updated'))
})

app.listen (5000, () => console.log ('Working!!'))


const itemsWithUserData = (items, res) => {
	let uploadersData = [];
	let usersIds = [];
	for (let i = 0; i < items.length; i++) {
		usersIds.push(items[i].author_id)
	}
	Users.find({_id: usersIds}).then(uploaders => {
		for (let i = 0; i < uploaders.length; i++) {
			uploadersData.push({
				id: uploaders[i]._id,
				photo: uploaders[i].photo,
				name: uploaders[i].firstname + ' ' + uploaders[i].surname
			})
		}
		res.json({
			items: items,
			authorsData: uploadersData
		})
	})
}
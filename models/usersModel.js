import mongoose, {Schema} from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const usersSchema = new Schema({
	photo: {type: String, lowercase: true},
	firstname: {type: String, required: true, lowercase: true},
	surname: {type: String, required: true, lowercase: true},
	email: {type: String, required: true, lowercase: true},
	profileBigPicture: {type: String, default: ''},
	passwordHash: {type: String, required: true},
	liked_photos: {type: Array, default: []},
	collections: {type: Array, default: []},
	counts: {
		photos: {type: Number, default: 0},
		likes: {type: Number, default: 0},
		photo_views: {type: Number, default: 0},
		followers: {type: Number, default: 0}
	}
});

usersSchema.methods.isValidPassword = function isValidPassword(password){
	return bcrypt.compareSync(password, this.passwordHash)
}

usersSchema.methods.generateJWT = function generateJWT() {
	return jwt.sign({
		email: this.email
	}, process.env.JWT_SECRET)
}

usersSchema.methods.verifyJWT = function verifyJWT(token) {
	return jwt.verify(token, process.env.JWT_SECRET)
}

usersSchema.methods.toAuthJSON = function toAuthJSON() {
	return {
		user_id: this._id,
		photo: this.photo,
		profileBigPicture: this.profileBigPicture,
		firstname: this.firstname,
		surname: this.surname,
		email: this.email,
		token: this.generateJWT(),
		liked_photos: this.liked_photos,
		collections: this.collections
	}
}

const Users = mongoose.model('users', usersSchema);

export default  Users
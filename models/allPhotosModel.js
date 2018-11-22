import mongoose, {Schema} from 'mongoose';

const allphotosSchema = new Schema({
	author_photo: {type: String, lowercase: true},
	author_name: {type: String, required: true, lowercase: true},
	author_id: {type: String, required: true, lowercase: true},
	photo_url: {type: String, required: true, lowercase: true},
	title: {type: String, required: true, lowercase: true},
	category: {type: String, lowercase: true},
	keywords: {type: Array, required: true},
	description: {type: String, lowercase: true},
	date: {type: Date, default: Date.now}
});

const Allphotos = mongoose.model('allphotos', allphotosSchema);

export default  Allphotos;
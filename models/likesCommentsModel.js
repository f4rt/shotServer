import mongoose, {Schema} from 'mongoose';

const likesCommentsSchema = new Schema({
	photo_id: {type: String},
	comments: {type: Array, default: []},
	likes: {type: Number, default: 0},
});

const LikesComments = mongoose.model('photo_likes_comments', likesCommentsSchema);

export default  LikesComments;
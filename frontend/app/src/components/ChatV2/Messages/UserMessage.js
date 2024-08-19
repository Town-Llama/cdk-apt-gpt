
const UserMessage = ({msg}) => {
    return (
        <div className="flex justify-end mb-6">
            <div className="message-bubble text-white rounded-lg py-2 px-4 max-w-md">
                {msg}
            </div>
        </div>
    );
}

export default UserMessage;
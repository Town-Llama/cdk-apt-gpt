CREATE TABLE Properties (
    id VARCHAR(36),
    timestamp TIMESTAMP,
    addressStreet VARCHAR(255),
    addressCity VARCHAR(255),
    addressState VARCHAR(2),
    addressZipCode VARCHAR(10),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    photosArray TEXT,
    description TEXT,
    transitScore INT,
    transitDescription TEXT,
    walkScore INT,
    walkDescription TEXT,
    buildingName VARCHAR(255),
    PRIMARY KEY (id, timestamp)
);

CREATE TABLE Unit (
    id VARCHAR(36),
    property_id VARCHAR(36),
    property_ts TIMESTAMP,
    available BOOLEAN,
    name TEXT,
    baths DECIMAL(2, 1),
    beds INT,
    area INT,
    ts TIMESTAMP,
    rent_12_month_monthly DECIMAL(10, 2),
    rent_11_month_monthly DECIMAL(10, 2),
    rent_10_month_monthly DECIMAL(10, 2),
    rent_9_month_monthly DECIMAL(10, 2),
    rent_8_month_monthly DECIMAL(10, 2),
    rent_7_month_monthly DECIMAL(10, 2),
    rent_6_month_monthly DECIMAL(10, 2),
    rent_5_month_monthly DECIMAL(10, 2),
    rent_4_month_monthly DECIMAL(10, 2),
    rent_3_month_monthly DECIMAL(10, 2),
    rent_2_month_monthly DECIMAL(10, 2),
    rent_1_month_monthly DECIMAL(10, 2),
    PRIMARY KEY (id, ts),
    FOREIGN KEY (property_id, property_ts) REFERENCES properties(id, timestamp)
);

CREATE TABLE placesOfInterest(
    id VARCHAR(36),
    ts timestamp,
    name text,
    category text,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    url text
);


CREATE TABLE RESPONSES (
    userId TEXT,
    conversationId TEXT,
    indexNum INTEGER,
    response TEXT,
    role TEXT,
    PRIMARY KEY (conversationId, indexNum)
);

create table waitlist (
 userid text,
 approved boolean,
 time timestamp,
 primary key(userid)
);

CREATE TABLE chats (
    userid TEXT,
    summary TEXT,
    conversationid TEXT PRIMARY KEY,
    commuteAddressLat DECIMAL(9,6),
    commuteAddressLng DECIMAL(9,6),
    poiCategories TEXT,
    poiData TEXT,
    chatState TEXT,
    aptIdArr TEXT
);

CREATE TABLE customerImages (
    imageid UUID PRIMARY KEY,
    userid TEXT,
    image BYTEA,
    time TIMESTAMPTZ,
    metadata JSONB,
    filetype TEXT,
    isPictureOfUnit BOOLEAN
);

create table queries (
    userid text,
    time TIMESTAMPTZ,
    query text,
    type text
);

CREATE TABLE blog (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(100) UNIQUE NOT NULL,
    description TYPE VARCHAR(160),
    content TEXT NOT NULL,
    keywords VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- embeddings: name, menu, reviews, descriptions
CREATE TABLE bar (
    id VARCHAR(60) PRIMARY KEY,
    name text,
    address TEXT,
    description TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6)
);

CREATE TABLE bar_menu_item (
    id SERIAL PRIMARY KEY,
    barid VARCHAR(60),
    name TEXT,
    description TEXT,
    price DECIMAL(10, 2),
    isDrink BOOLEAN,
    category TEXT,
    FOREIGN KEY (barid) REFERENCES bar(id)
);

# alex >> week 3
create table bar_reviews ( 
    id varchar(),
    user text,
)

# week 3
create table bar_images (
    id varchar(),
    data bytea,
)

# week 4 >> embedding model to hugging face
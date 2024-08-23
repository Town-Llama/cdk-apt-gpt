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
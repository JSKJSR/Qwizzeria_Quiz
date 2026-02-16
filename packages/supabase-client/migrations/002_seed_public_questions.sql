-- ============================================================
-- Qwizzeria — Seed Data: 60 public questions across 6 categories
-- Run after 001_initial_schema.sql
-- ============================================================

INSERT INTO questions_master (question_text, answer_text, answer_explanation, category, sub_category, is_public, status, tags) VALUES

-- ===== SCIENCE (10) =====
('What is the chemical symbol for gold?', 'Au', 'Au comes from the Latin word "aurum" meaning gold.', 'Science', 'Chemistry', true, 'active', ARRAY['chemistry', 'elements']),
('What planet is known as the Red Planet?', 'Mars', 'Mars appears red due to iron oxide (rust) on its surface.', 'Science', 'Astronomy', true, 'active', ARRAY['astronomy', 'planets']),
('What is the powerhouse of the cell?', 'Mitochondria', 'Mitochondria generate most of the cell''s supply of ATP, used as chemical energy.', 'Science', 'Biology', true, 'active', ARRAY['biology', 'cells']),
('What gas do plants absorb from the atmosphere?', 'Carbon dioxide (CO₂)', 'Plants use CO₂ in photosynthesis to produce glucose and oxygen.', 'Science', 'Biology', true, 'active', ARRAY['biology', 'photosynthesis']),
('What is the speed of light in km/s (approximately)?', '300,000 km/s', 'The exact value is 299,792.458 km/s in a vacuum.', 'Science', 'Physics', true, 'active', ARRAY['physics', 'light']),
('What is the most abundant gas in Earth''s atmosphere?', 'Nitrogen', 'Nitrogen makes up about 78% of Earth''s atmosphere.', 'Science', 'Earth Science', true, 'active', ARRAY['earth science', 'atmosphere']),
('What is the chemical formula for table salt?', 'NaCl', 'Sodium chloride — one sodium atom bonded to one chlorine atom.', 'Science', 'Chemistry', true, 'active', ARRAY['chemistry', 'compounds']),
('How many bones are in the adult human body?', '206', 'Babies are born with about 270 bones, but many fuse together as they grow.', 'Science', 'Biology', true, 'active', ARRAY['biology', 'anatomy']),
('What does DNA stand for?', 'Deoxyribonucleic acid', 'DNA carries the genetic instructions for the development and function of living organisms.', 'Science', 'Biology', true, 'active', ARRAY['biology', 'genetics']),
('Which planet has the most moons in our solar system?', 'Saturn', 'As of 2023, Saturn has 146 confirmed moons, surpassing Jupiter.', 'Science', 'Astronomy', true, 'active', ARRAY['astronomy', 'planets']),

-- ===== GEOGRAPHY (10) =====
('What is the smallest country in the world by area?', 'Vatican City', 'Vatican City covers just 0.44 km² (110 acres) within Rome, Italy.', 'Geography', 'Countries', true, 'active', ARRAY['countries', 'europe']),
('What is the longest river in the world?', 'The Nile', 'The Nile stretches approximately 6,650 km through northeastern Africa.', 'Geography', 'Physical', true, 'active', ARRAY['rivers', 'africa']),
('Which country has the most natural lakes?', 'Canada', 'Canada has over 879,000 lakes, more than the rest of the world combined.', 'Geography', 'Physical', true, 'active', ARRAY['lakes', 'north america']),
('What is the capital of Australia?', 'Canberra', 'Not Sydney or Melbourne — Canberra was chosen as a compromise between the two rival cities.', 'Geography', 'Capitals', true, 'active', ARRAY['capitals', 'oceania']),
('Mount Everest sits on the border of which two countries?', 'Nepal and China (Tibet)', 'The summit is at 8,849 meters (29,032 ft) above sea level.', 'Geography', 'Physical', true, 'active', ARRAY['mountains', 'asia']),
('What is the driest continent on Earth?', 'Antarctica', 'Despite all the ice, Antarctica receives very little precipitation — technically a desert.', 'Geography', 'Physical', true, 'active', ARRAY['continents', 'climate']),
('Which African country was formerly known as Abyssinia?', 'Ethiopia', 'The name Abyssinia was used until the 20th century.', 'Geography', 'Countries', true, 'active', ARRAY['countries', 'africa']),
('What strait separates Europe from Africa?', 'Strait of Gibraltar', 'At its narrowest point, it is only 14.3 km (8.9 miles) wide.', 'Geography', 'Physical', true, 'active', ARRAY['straits', 'europe', 'africa']),
('Which country is known as the Land of the Rising Sun?', 'Japan', 'The name "Nihon" literally means "origin of the sun."', 'Geography', 'Countries', true, 'active', ARRAY['countries', 'asia']),
('What is the largest desert in the world?', 'The Sahara (or Antarctica if counting polar deserts)', 'The Sahara is the largest hot desert at 9.2 million km². Antarctica is the largest overall desert.', 'Geography', 'Physical', true, 'active', ARRAY['deserts', 'africa']),

-- ===== HISTORY (10) =====
('In what year did the Berlin Wall fall?', '1989', 'The wall fell on November 9, 1989, leading to German reunification in 1990.', 'History', 'Modern', true, 'active', ARRAY['modern history', 'europe']),
('Who was the first person to walk on the Moon?', 'Neil Armstrong', 'Armstrong stepped onto the lunar surface on July 20, 1969, during Apollo 11.', 'History', 'Space', true, 'active', ARRAY['space', 'usa']),
('What ancient wonder of the world still exists today?', 'The Great Pyramid of Giza', 'Built around 2560 BC, it is the oldest and only surviving ancient wonder.', 'History', 'Ancient', true, 'active', ARRAY['ancient history', 'egypt']),
('Which empire was ruled by Genghis Khan?', 'The Mongol Empire', 'At its peak, the Mongol Empire was the largest contiguous land empire in history.', 'History', 'Medieval', true, 'active', ARRAY['medieval', 'asia']),
('In which year did World War I begin?', '1914', 'WWI began on July 28, 1914, triggered by the assassination of Archduke Franz Ferdinand.', 'History', 'Modern', true, 'active', ARRAY['world wars', 'europe']),
('Who painted the ceiling of the Sistine Chapel?', 'Michelangelo', 'Michelangelo painted the ceiling between 1508 and 1512.', 'History', 'Art', true, 'active', ARRAY['art', 'renaissance', 'italy']),
('What was the name of the ship on which the Pilgrims traveled to America in 1620?', 'The Mayflower', 'The Mayflower carried 102 passengers from Plymouth, England to the New World.', 'History', 'Colonial', true, 'active', ARRAY['colonial', 'usa']),
('Which civilization built Machu Picchu?', 'The Inca civilization', 'Machu Picchu was built in the 15th century and is located in modern-day Peru.', 'History', 'Ancient', true, 'active', ARRAY['ancient history', 'south america']),
('Who was the first female Prime Minister of the United Kingdom?', 'Margaret Thatcher', 'Thatcher served as PM from 1979 to 1990, earning the nickname "The Iron Lady."', 'History', 'Modern', true, 'active', ARRAY['modern history', 'uk']),
('What year did the Titanic sink?', '1912', 'The RMS Titanic sank on April 15, 1912, after hitting an iceberg on its maiden voyage.', 'History', 'Modern', true, 'active', ARRAY['modern history', 'maritime']),

-- ===== ARTS & ENTERTAINMENT (10) =====
('Who wrote the Harry Potter series?', 'J.K. Rowling', 'The first book, Harry Potter and the Philosopher''s Stone, was published in 1997.', 'Arts & Entertainment', 'Literature', true, 'active', ARRAY['literature', 'fantasy']),
('What is the highest-grossing film of all time (not adjusted for inflation)?', 'Avatar (2009)', 'Avatar earned over $2.9 billion worldwide at the box office.', 'Arts & Entertainment', 'Film', true, 'active', ARRAY['film', 'box office']),
('Which band released the album "Abbey Road"?', 'The Beatles', 'Abbey Road was released in 1969 and features the iconic crosswalk cover.', 'Arts & Entertainment', 'Music', true, 'active', ARRAY['music', 'rock']),
('Who painted the Mona Lisa?', 'Leonardo da Vinci', 'The Mona Lisa was painted between 1503 and 1519 and hangs in the Louvre, Paris.', 'Arts & Entertainment', 'Art', true, 'active', ARRAY['art', 'renaissance']),
('What is the longest-running Broadway show?', 'The Phantom of the Opera', 'It ran from 1988 to 2023, with over 13,000 performances.', 'Arts & Entertainment', 'Theatre', true, 'active', ARRAY['theatre', 'broadway']),
('Who directed the film "Schindler''s List"?', 'Steven Spielberg', 'The 1993 film won seven Academy Awards including Best Picture and Best Director.', 'Arts & Entertainment', 'Film', true, 'active', ARRAY['film', 'directors']),
('In which city is the famous La Scala opera house?', 'Milan, Italy', 'Teatro alla Scala opened in 1778 and is one of the world''s most prestigious opera houses.', 'Arts & Entertainment', 'Music', true, 'active', ARRAY['music', 'opera', 'italy']),
('Who wrote "1984" and "Animal Farm"?', 'George Orwell', 'Orwell''s real name was Eric Arthur Blair. Both novels are political allegories.', 'Arts & Entertainment', 'Literature', true, 'active', ARRAY['literature', 'classics']),
('What Netflix series features the fictional game "Squid Game"?', 'Squid Game', 'The South Korean survival drama became Netflix''s most-watched series in 2021.', 'Arts & Entertainment', 'Television', true, 'active', ARRAY['television', 'netflix']),
('Who composed "The Four Seasons"?', 'Antonio Vivaldi', 'Written in 1723, it is one of the most popular pieces of Baroque music.', 'Arts & Entertainment', 'Music', true, 'active', ARRAY['music', 'classical']),

-- ===== SPORTS (10) =====
('In which sport would you perform a "slam dunk"?', 'Basketball', 'A slam dunk is when a player jumps and scores by putting the ball directly through the hoop.', 'Sports', 'Basketball', true, 'active', ARRAY['basketball']),
('How many players are on a standard soccer team on the field?', '11', 'Each team fields 11 players including the goalkeeper.', 'Sports', 'Football', true, 'active', ARRAY['football', 'soccer']),
('Which country has won the most FIFA World Cup titles?', 'Brazil', 'Brazil has won the World Cup 5 times (1958, 1962, 1970, 1994, 2002).', 'Sports', 'Football', true, 'active', ARRAY['football', 'world cup']),
('What is the only Grand Slam tennis tournament played on clay?', 'The French Open (Roland Garros)', 'Held annually in Paris since 1891.', 'Sports', 'Tennis', true, 'active', ARRAY['tennis', 'grand slam']),
('In which city were the first modern Olympic Games held in 1896?', 'Athens, Greece', 'The 1896 Olympics featured 241 athletes from 14 nations.', 'Sports', 'Olympics', true, 'active', ARRAY['olympics', 'greece']),
('What is the maximum score in a single frame of bowling?', '30', 'A strike in the 10th frame with two bonus strikes gives 30 points for that frame.', 'Sports', 'Bowling', true, 'active', ARRAY['bowling']),
('Which Formula 1 driver holds the record for most World Championship titles?', 'Lewis Hamilton and Michael Schumacher (7 each)', 'Both drivers achieved 7 World Championship titles.', 'Sports', 'Motorsport', true, 'active', ARRAY['f1', 'motorsport']),
('In cricket, how many runs is a "century"?', '100', 'Scoring 100 or more runs in a single innings is called a century.', 'Sports', 'Cricket', true, 'active', ARRAY['cricket']),
('What sport is played at Wimbledon?', 'Tennis', 'Wimbledon is the oldest tennis tournament in the world, first held in 1877.', 'Sports', 'Tennis', true, 'active', ARRAY['tennis', 'grand slam']),
('Which country invented the sport of judo?', 'Japan', 'Judo was created by Jigoro Kano in 1882 and became an Olympic sport in 1964.', 'Sports', 'Martial Arts', true, 'active', ARRAY['martial arts', 'japan']),

-- ===== FOOD & DRINK (10) =====
('What country is the origin of the croissant?', 'Austria (not France)', 'The kipferl, ancestor of the croissant, originated in Austria. The French adapted it.', 'Food & Drink', 'Origins', true, 'active', ARRAY['baking', 'europe']),
('What is the main ingredient in guacamole?', 'Avocado', 'Guacamole originated from the Aztecs in Mexico.', 'Food & Drink', 'Ingredients', true, 'active', ARRAY['mexican food', 'ingredients']),
('Which country produces the most coffee in the world?', 'Brazil', 'Brazil has been the world''s largest coffee producer for over 150 years.', 'Food & Drink', 'Beverages', true, 'active', ARRAY['coffee', 'beverages']),
('What type of pasta is shaped like little ears?', 'Orecchiette', 'The name comes from the Italian word "orecchia" meaning ear.', 'Food & Drink', 'Pasta', true, 'active', ARRAY['pasta', 'italian food']),
('Scoville units measure the heat of what?', 'Chili peppers', 'The Scoville scale was developed by Wilbur Scoville in 1912.', 'Food & Drink', 'Spices', true, 'active', ARRAY['spices', 'measurement']),
('What Japanese dish consists of vinegared rice with raw fish?', 'Sushi', 'Sushi originated in Southeast Asia as a way to preserve fish in fermented rice.', 'Food & Drink', 'Cuisine', true, 'active', ARRAY['japanese food', 'seafood']),
('What nut is used to make marzipan?', 'Almond', 'Marzipan is a paste made from ground almonds, sugar, and egg whites.', 'Food & Drink', 'Ingredients', true, 'active', ARRAY['baking', 'nuts']),
('In which country did the pretzel originate?', 'Germany (or Italy, debated)', 'The pretzel''s origins are debated, with claims from both German and Italian monks.', 'Food & Drink', 'Origins', true, 'active', ARRAY['baking', 'europe']),
('What is the world''s most expensive spice by weight?', 'Saffron', 'Saffron is harvested from crocus flowers — each flower produces only three stigmas.', 'Food & Drink', 'Spices', true, 'active', ARRAY['spices', 'ingredients']),
('Which fruit is known as the "king of fruits" in Southeast Asia?', 'Durian', 'Durian is famous for its strong odor and is banned on public transport in some countries.', 'Food & Drink', 'Fruits', true, 'active', ARRAY['fruits', 'asia']);
